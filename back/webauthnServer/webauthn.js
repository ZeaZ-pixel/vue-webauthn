const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fido2 = require('@simplewebauthn/server');
const base64url = require('base64url');
const mysql = require('mysql');
const fs = require('fs');
const low = require('lowdb');

if (!fs.existsSync('./.data')) {
    fs.mkdirSync('./.data');
}

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('.data/db.json');
const db = low(adapter);

router.use(express.json());

const RP_NAME = 'Nariman webauthn';
const TIMEOUT = 30 * 1000 * 60;

db.defaults({
    users: [],
}).write();

const csrfCheck = (req, res, next) => {
    if (req.header('X-Requested-With') !== 'XMLHttpRequest') {
        res.status(400).json({ error: 'invalid access.' });
        return;
    }
    next();
};

router.get('/signout', (req, res) => {
    delete req.session.username;
    res.redirect(302, '/');
});


router.post('/getKeys', csrfCheck,  (req, res) => {
    const user = db.get('users').find({ username: req.session.username }).value();
    res.json(user || {});
});



router.post('/removeKey', csrfCheck, (req, res) => {
    const credId = req.query.credId;
    console.log(credId);
    const username = req.session.username;
    const user = db.get('users').find({ username: username }).value();

    const newCreds = user.credentials.filter((cred) => {
        return cred.credId !== credId;
    });


    db.get('users')
        .find({ username: username })
        .assign({ credentials: newCreds })
        .write();

    res.json({});
});

router.get('/resetDB', (req, res) => {
    db.set('users', []).write();
    const users = db.get('users').value();
    res.json(users);
});

router.post('/registerRequest', csrfCheck, async (req, res) => {
    const username = req.body.username;
    req.session.username = username;
    // Only check username, no need to check password as this is a mock
    // See if account already exists
    let user = db.get('users').find({ username: username }).value();
    // If user entry is not created yet, create one
    if (!user) {
        user = {
            username: username,
            id: base64url.encode(crypto.randomBytes(32)),
            credentials: [],
        };
        db.get('users').push(user).write();

    }


    try {
        const excludeCredentials = [];
        if (user.credentials.length > 0) {
            for (let cred of user.credentials) {
                excludeCredentials.push({
                    id: cred.credId,
                    type: 'public-key',
                    transports: ['internal'],
                });
            }
        }
        const pubKeyCredParams = [];
        const params = [-7, -257];

        for (let param of params) {
            pubKeyCredParams.push({ type: 'public-key', alg: param });
        }
        const as = {}; // authenticatorSelection
        const aa = req.body.opts.authenticatorSelection.authenticatorAttachment;
        const rr = req.body.opts.authenticatorSelection.requireResidentKey;
        const uv = req.body.opts.authenticatorSelection.userVerification;
        const cp = req.body.opts.attestation;// attestationConveyancePreference
        let asFlag = false;
        let authenticatorSelection;
        let attestation = 'none';

        if (aa && (aa === 'platform' || aa === 'cross-platform')) {
            asFlag = true;
            as.authenticatorAttachment = aa;
        }
        if (rr && typeof rr == 'boolean') {
            asFlag = true;
            as.requireResidentKey = rr;
        }
        if (uv && (uv === 'required' || uv === 'preferred' || uv === 'discouraged')) {
            asFlag = true;
            as.userVerification = uv;
        }
        if (asFlag) {
            authenticatorSelection = as;
        }
        if (cp && (cp === 'none' || cp === 'indirect' || cp === 'direct')) {
            attestation = cp;
        }
        const options = fido2.generateAttestationOptions({
            rpName: RP_NAME,
            rpID:process.env.HOSTNAME,
            userID: user.id,
            userName: user.username,
            timeout: TIMEOUT,
            attestationType: attestation,
            excludeCredentials,
            authenticatorSelection,
        });

        req.session.challenge = options.challenge;

        // Temporary hack until SimpleWebAuthn supports `pubKeyCredParams`
        options.pubKeyCredParams = [];
        for (let param of params) {
            options.pubKeyCredParams.push({ type: 'public-key', alg: param });
        }
        res.json(options);
    } catch (e) {
        res.status(400).send({ error: e });
    }
});

router.post('/registerResponse', csrfCheck, async (req, res) => {
    const username = req.session.username;
    const expectedChallenge = req.session.challenge;
    const expectedOrigin = process.env.ORIGIN ;
    const expectedRPID = process.env.HOSTNAME;
    const credId = req.body.id;
    const type = req.body.type;
    const { body } = req;
    let verification;
    try {
        try {
            verification = await fido2.verifyAttestationResponse({
                credential: body,
                expectedChallenge,
                expectedOrigin,
                expectedRPID,
            });
        } catch (error) {
            console.error(error);
            return res.status(400).send({ error: error.message });
        }
        const { verified, authenticatorInfo } = verification;

        if (!verified) {
            throw 'User verification failed.';
        }

        const { base64PublicKey, base64CredentialID, counter } = authenticatorInfo;

        const user = db.get('users').find({ username: username }).value();

        const existingCred = user.credentials.find(
            (cred) => cred.credID === base64CredentialID,
        );
        if (!existingCred) {
            /**
             * Add the returned device to the user's list of devices
             */
            user.credentials.push({
                publicKey: base64PublicKey,
                credId: base64CredentialID,
                prevCounter: counter,
            });
        }

        db.get('users').find({ username: username }).assign(user).write();

        delete req.session.challenge;

        // Respond with user info
        res.json(user);
    } catch (e) {
        delete req.session.challenge;
        res.status(400).send({ error: e.message });
    }
});


router.post('/signinRequest', csrfCheck, async (req, res) => {
    try {
        const user = db
            .get('users')
            .find({ username: req.session.username })
            .value();
        if (!user) {
            // Send empty response if user is not registered yet.
            res.json({ error: 'User not found.' });
            return;
        }

        const credId = req.query.credId;

        const userVerification = req.body.userVerification || 'required';

        const allowCredentials = [];
        for (let cred of user.credentials) {
            // `credId` is specified and matches
            if (credId && cred.credId === credId) {
                allowCredentials.push({
                    id: cred.credId,
                    type: 'public-key',
                    transports: ['internal']
                });
            }
        }
        const options = fido2.generateAssertionOptions({
            timeout: TIMEOUT,
            rpID: process.env.HOSTNAME,
            allowCredentials,
            userVerification,
        });
        req.session.challenge = options.challenge;
        res.json(options);
    } catch (e) {
        res.status(400).json({ error: e });
    }
});

router.post('/signinResponse', csrfCheck, async (req, res) => {
    const { body } = req;
    const expectedChallenge = req.session.challenge;
    const expectedOrigin = process.env.ORIGIN;
    const expectedRPID = process.env.HOSTNAME;
    const credId = req.body.id;
    const type = req.body.type;
    const user = db.get('users').find({ username: req.session.username }).value();

    let credential = user.credentials.find((cred) => cred.credId === req.body.id);
    try {
        if (!credential) {
            throw 'Authenticating credential not found.';
        }
        let verification;
        try {
            verification = fido2.verifyAssertionResponse({
                credential: body,
                expectedChallenge,
                expectedOrigin,
                expectedRPID,
                authenticator: credential,
            });
        } catch (error) {
            console.error(error);
            return res.status(400).send({ error: error.message });
        }
        const { verified, authenticatorInfo } = verification;

        if (!verified) {
            throw 'User verification failed.';
        }

        credential.prevCounter = authenticatorInfo.counter;

        db.get('users').find({ username: req.session.username }).assign(user).write();
        delete req.session.challenge;
        res.json(user);
    } catch (e) {
        delete req.session.challenge;
        res.status(400).json({ error: e });
    }
});

module.exports = router;