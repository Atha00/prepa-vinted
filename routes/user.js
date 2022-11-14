const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const base64 = require("crypto-js/enc-base64");
const router = express.Router();

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // console.log(req.body);
    // {
    //     username: 'JohnDoe',
    //     email: 'johndoe@lereacteur.io',
    //     password: 'azerty',
    //     newsletter: true
    // }
    if (req.body.username && req.body.email) {
      const userExisting = await User.find({ email: req.body.email });
      if (userExisting.length > 0) {
        res.status(409).json("This email is already used");
      } else {
        const salt = uid2(16);
        const token = uid2(16);
        const hash = SHA256(req.body.password + salt).toString(base64);
        const newUser = new User({
          email: req.body.email,
          account: {
            username: req.body.username,
          },
          newsletter: req.body.newsletter,
          token: token,
          hash: hash,
          salt: salt,
        });
        await newUser.save();
        res.status(201).json({
          _id: newUser._id,
          token: newUser.token,
          account: {
            username: req.body.username,
          },
        });
      }
    } else {
      res.status(400).json("email or username missing");
    }
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.body); { email: 'johndoe@lereacteur.io', password: 'azerty' }
    const userFound = await User.findOne({ email: req.body.email });
    if (userFound) {
      const hash = SHA256(req.body.password + userFound.salt).toString(base64);
      if (hash === userFound.hash) {
        res.status(200).json({
          _id: userFound._id,
          token: userFound.token,
          account: {
            username: userFound.account.username,
          },
        });
      } else {
        res.status(401).json("Unauthorized");
      }
    } else {
      res.status(401).json("Bad email or password");
    }
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
