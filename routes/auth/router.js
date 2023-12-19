const express = require("express");
const passport = require("passport");
const router = express.Router();

const { validateSchema } = require("../../utils");

const {
  loginSchema,
  registerSchema,
  sendCodeSchema,
} = require("./validation");

const { login, register, getMe, sendCode } = require("./controller");

router
  .route("/login")
  .post(
    validateSchema(loginSchema),
    passport.authenticate("local", { session: false }),
    login
  );
router.route("/send-code").post(validateSchema(sendCodeSchema), sendCode);
router.route("/register").post(validateSchema(registerSchema), register);

router
  .route("/profile")
  .get(passport.authenticate("jwt", { session: false }), getMe);

module.exports = router;
