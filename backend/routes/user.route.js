const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel } = require("../model/user.model");

const userRouter = express.Router();

// 1. /user/register
userRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    bcrypt.hash(password, 5, async (err, hash) => {
      if (err) {
        res.send({ msg: "Something went wrong", error: err.message });
      } else {
        const user = new userModel({ name, email, password: hash });
        await user.save();
        res.send({ msg: "User registered successfully" });
      }
    });
  } catch (error) {
    res.send({ msg: "Something went wrong", error: error.message });
  }
});

// 2. /user/login
userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.find({ email });
    console.log(user);
    if (user.length > 0) {
      bcrypt.compare(password, user[0].password, (err, result) => {
        if (result) {
          const token = jwt.sign({ userID: user[0]._id }, "coding");
          res.send({ msg: "Login Successfully", token, userName: user[0].name });
        } else {
          res.send({ msg: "Wrong Password" });
        }
      });
    } else {
      res.send({ msg: "User is not Registered" });
    }
  } catch (error) {
    res.send({ msg: "User is not Registered" });
  }
});

// 3. /user/logout
userRouter.get("/logout", (req, res) => {
  res.send({ msg: "Logout Successfully" });
});

module.exports = { userRouter };