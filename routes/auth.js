const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/auth");
const User = require("../models/user");
const { body } = require("express-validator");

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc=>{
            if(userDoc)
            return Promise.reject('email already exist');
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().isLength({ min: 2 }),
  ],
  authControllers.signup
);

router.post('/login',authControllers.login);

module.exports = router;
