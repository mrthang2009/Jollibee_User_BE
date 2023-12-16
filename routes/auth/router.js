const express = require("express");
const passport = require("passport");
const router = express.Router();

const { validateSchema } = require("../../utils");

const { loginSchema, registerSchema, verifySchema } = require("./validation");

const { login, register,verify, getMe } = require("./controller");

router
  .route("/login")
  .post(
    validateSchema(loginSchema),
    passport.authenticate("local", { session: false }),
    login
  );

router.route("/register").post(validateSchema(registerSchema), register);
router.route("/verify").post(validateSchema(verifySchema), verify);

router
  .route("/profile")
  .get(passport.authenticate("jwt", { session: false }), getMe);

module.exports = router;
