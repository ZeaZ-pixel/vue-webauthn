import {startAttestation, startAssertion} from '@simplewebauthn/browser'
export const _fetch = async (path, payload = '') => {
    const headers = {
        'X-Requested-With': 'XMLHttpRequest',
    };
    if (payload && !(payload instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(payload);
    }
    const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: headers,
        body: payload,
    });
    if (res.status === 200) {
        // Server authentication succeeded
        return res.json();
    } else {
        // Server authentication failed
        const result = await res.json();
        throw result.error;
    }
};

export const registerCredential = async (username) => {
    const param = {
        username,
        opts : {
            attestation: 'none',
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                requireResidentKey: false
            }
        }
    };
    const options = await _fetch('http://localhost:3001/webauthn/registerRequest', param);
    let attResp;
    try {
        attResp = await startAttestation(await options);
    } catch (error) {
        if (error.name === 'InvalidStateError') {
            console.log('Error: Authenticator was probably already registered by user');
        } else {
            console.log(error);
        }

        throw error;
    }

    localStorage.setItem(`credId`, attResp.id);
    return await _fetch('http://localhost:3001/webauthn/registerResponse', attResp);
};

export const unregisterCredential = async credId => {
    localStorage.removeItem("credId");
    return _fetch(`/webauthn/removeKey?credId=${encodeURIComponent(credId)}`);
};

export const authenticate = async () => {
    const opts = {};
    let url = "http://localhost:3001/webauthn/signinRequest";
    const credId = localStorage.getItem(`credId`);
    if (credId) {
        url += `?credId=${encodeURIComponent(credId)}`;
    }
    const options = await _fetch(url, opts);
    let asseResp;
    try {
        const opts = await options;
        asseResp = await startAssertion(opts);
    } catch (error) {
        console.log(error)
        throw new Error(error);
    }
    return await _fetch(`http://localhost:3001/webauthn/signinResponse`, asseResp);
};
