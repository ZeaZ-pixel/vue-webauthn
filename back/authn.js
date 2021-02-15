const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt")
const saltRounds = 10;

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "root",
    database: "registration",
});

router.post("/register", (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.log(err);
        }
        db.query(
            "SELECT * FROM users WHERE email = ?;",
            [email],
            (err, result) => {
                if (err) {
                    res.send({ err: err });
                }

                if (result.length === 0) {
                    db.query(
                        "INSERT INTO users (id, username, email, password) VALUES (?,?,?,?)",
                        [null,username, email,hash],
                        (err, result) => {
                            if (err) {
                                res.send({
                                    "code":400,
                                    "failed":"error ocurred"
                                })
                            } else {
                                res.send({
                                    "code":200,
                                    "success":"user registered sucessfully",
                                    "email": email
                                });
                            }
                        }
                    );
                } else {
                    res.send({
                        "code":400,
                        "failed":"email already exists"
                    });
                }
            }
        );


    });
});

router.get("/login", (req, res) => {
    if (req.session.user) {
        res.send({ loggedIn: true, user: req.session.user });
    } else {
        res.send({ loggedIn: false });
    }
});

router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    db.query(
        "SELECT * FROM users WHERE email = ?;",
        [email],
        (err, result) => {
            if (err) {
                res.send({ err: err });
            }

            if (result.length > 0) {
                bcrypt.compare(password, result[0].password, (error, response) => {
                    if (response) {
                        res.send(result);
                    } else {
                        res.send({ message: "Wrong username/password combination!" });
                    }
                });
            } else {
                res.send({ message: "User doesn't exist" });
            }
        }
    );
});
module.exports = router;
