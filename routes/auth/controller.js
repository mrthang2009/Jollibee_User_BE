const JWT = require("jsonwebtoken");

const {
  generateToken,
  generateRefreshToken,
  generateVerificationCode,
  sendVerificationEmail,
} = require("../../utils/jwtHelper");
const { Customer, Cart } = require("../../models");

let storedVerificationCode; // Đặt biến ngoài phạm vi hàm

module.exports = {
  login: async (req, res, next) => {
    try {
      const {
        _id,
        firstName,
        lastName,
        email,
        password,
        birthday,
        phoneNumber,
        provinceCode,
        provinceName,
        districtCode,
        districtName,
        wardCode,
        wardName,
        address,
        updatedAt,
      } = req.user;

      const token = generateToken({
        _id,
        firstName,
        lastName,
        email,
        birthday,
        phoneNumber,
        provinceCode,
        provinceName,
        districtCode,
        districtName,
        wardCode,
        wardName,
        address,
        updatedAt,
      });

      const refreshToken = generateRefreshToken(_id);

      return res.status(200).json({
        message: "Login of user successfully",
        token,
        refreshToken,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Login of user failed", error: err });
    }
  },

  register: async (req, res, next) => {
    try {
      const { firstName, lastName, email, phoneNumber, password } = req.body;
      const getEmailExits = Customer.findOne({ email });
      const getPhoneExits = Customer.findOne({ phoneNumber });

      const [foundEmail, foundPhoneNumber] = await Promise.all([
        getEmailExits,
        getPhoneExits,
      ]);

      const errors = [];
      if (foundEmail) errors.push("Email đã tồn tại");
      if (foundPhoneNumber) errors.push("Số điện thoại đã tồn tại");

      if (errors.length > 0) {
        return res.status(404).json({
          message: "Register is not valid",
          error: `${errors}`,
        });
      }
      const verificationCode = generateVerificationCode();
      storedVerificationCode = verificationCode;
      // Gửi mã xác thực qua email
      await sendVerificationEmail(email, verificationCode);
      return res.send({
        message: "The authentication code has been sent to gmail successfully",
        payload: verificationCode,
      });
    } catch (err) {
      console.error("Error during verification:", error);
      return res
        .status(500)
        .json({ message: "Tạo tài khoản thất bại", error: error });
    }
  },
  verify: async (req, res, next) => {
    try {
      const { firstName, lastName, email, phoneNumber, password, enteredCode } =
        req.body;
      if (enteredCode !== storedVerificationCode) {
        return res.status(400).json({ message: "Mã xác thực không hợp lệ" });
      } else {
        const newCustomer = new Customer({
          firstName,
          lastName,
          email,
          phoneNumber,
          password,
          birthday,
          avatarId: null,
        });
        const result = await newCustomer.save();

        const customerId = result._id;

        const newCart = new Cart({ customerId });

        newCart.save();
        return res
          .status(200)
          .json({ message: "Tạo tài khoản thành công", payload: result });
      }
    } catch (err) {
      console.error("Error during verification:", error);
      return res
        .status(500)
        .json({ message: "Tạo tài khoản thất bại", error: error });
    }
  },
  getMe: async (req, res, next) => {
    try {
      return res.status(200).json({
        message: "Get me of user successfully",
        payload: req.user,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Login of user failed", error: err });
    }
  },
};
