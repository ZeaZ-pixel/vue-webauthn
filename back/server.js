const express = require('express');
const session = require('express-session');
const cors = require('cors');
const authn = require('./authn')
const webauthn = require('./webauthn')
const app = express();
const bodyParser = require('body-parser')
require('dotenv').config()
app.use(bodyParser.json())
app.use(session({secret: 'tester', saveUninitialized: true, resave: false, cookie: {maxAge: 5*60000}}))

app.use(express.json());

app.use(
    cors({
        origin: ["http://localhost:8080"],
        methods: ["GET", "POST"],
        credentials: true,
    })
);

app.use('/authn', authn);
app.use('/webauthn', webauthn);
app.listen(3001, () => {
    console.log("running server");
});