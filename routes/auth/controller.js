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
      const { _id, firstName, lastName, email } = req.user;

      const token = generateToken({
        _id,
        firstName,
        lastName,
        email,
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
  sendCode: async (req, res, next) => {
    try {
      const { email, phoneNumber, forgotPassword } = req.body;

      const getEmailExits = Customer.findOne({ email });
      const getPhoneExits = Customer.findOne({ phoneNumber });

      const [foundEmail, foundPhoneNumber] = await Promise.all([
        getEmailExits,
        getPhoneExits,
      ]);

      const errors = [];
      if (!forgotPassword) {
        if (foundEmail) errors.push("Email đã tồn tại");
        if (foundPhoneNumber) errors.push("Số điện thoại đã tồn tại");
      } else {
        if (!foundEmail) errors.push("Email tài khoản không tồn tại");
      }

      if (errors.length > 0) {
        return res.status(404).json({
          message: "Gửi mã xác nhận thất bại",
          error: errors.join(", "),
        });
      }

      // Tạo và gửi mã xác nhận
      const verificationCode = generateVerificationCode();
      storedVerificationCode = verificationCode;
      await sendVerificationEmail(email, verificationCode.code);

      return res.send({
        message: "Mã xác nhận đã được gửi đến địa chỉ email thành công",
        payload: verificationCode,
      });
    } catch (error) {
      console.error("Error during verification:", error);
      return res
        .status(500)
        .json({ message: "Gửi mã xác nhận thất bại", error });
    }
  },
  register: async (req, res, next) => {
    try {
      const { firstName, lastName, email, phoneNumber, password, enteredCode } =
        req.body;

      // Kiểm tra xem có mã xác thực nào được lưu trữ không
      if (!storedVerificationCode) {
        return res.status(400).json({ message: "Mã xác thực không tồn tại" });
      }

      // Kiểm tra xem mã xác thực có đúng không
      if (enteredCode != storedVerificationCode.code) {
        return res.status(400).json({ message: "Mã xác thực không đúng" });
      }
      if (enteredCode == storedVerificationCode.code) {
        // Kiểm tra xem mã xác thực có hết hạn hay không
        const currentTime = new Date().getTime();
        const expirationTime =
          storedVerificationCode.createdAt.getTime() +
          storedVerificationCode.expiresIn;
        if (currentTime > expirationTime) {
          return res.status(400).json({ message: "Mã xác thực đã hết hạn" });
        } else {
          const newCustomer = new Customer({
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
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
      }
    } catch (err) {
      console.error("Error during verification:", err);
      return res
        .status(500)
        .json({ message: "Tạo tài khoản thất bại", error: err });
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const { email, newPassword, confirmPassword, enteredCode } = req.body;
      if (newPassword !== confirmPassword) {
        return res.status(404).json({
          message: "confirmPassWord and newPassword not match",
        });
      }
      if (!storedVerificationCode) {
        return res.status(400).json({ message: "Mã xác thực không tồn tại" });
      }
      // Kiểm tra xem mã xác thực có đúng không
      if (enteredCode != storedVerificationCode.code) {
        return res.status(400).json({ message: "Mã xác thực không đúng" });
      }
      if (enteredCode == storedVerificationCode.code) {
        // Kiểm tra xem mã xác thực có hết hạn hay không
        const currentTime = new Date().getTime();
        const expirationTime =
          storedVerificationCode.createdAt.getTime() +
          storedVerificationCode.expiresIn;
        if (currentTime > expirationTime) {
          return res.status(400).json({ message: "Mã xác thực đã hết hạn" });
        } else {
          const resetPassword = await Customer.findOneAndUpdate(
            { email: email, isDeleted: false },
            {
              password: newPassword,
            },
            { new: true }
          );

          if (!resetPassword) {
            return res.status(410).json({
              message: "Change password information of customer not found",
            });
          }
          return res.status(200).json({
            message: "Change password information of customer successfully",
            payload: resetPassword,
          });
        }
      }
    } catch (err) {
      return res.send(404, {
        message: "Change password information of customer failed",
        error: err,
      });
    }
  },
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      JWT.verify(refreshToken, jwtSettings.SECRET, async (err, data) => {
        if (err) {
          return res.status(401).json({
            message: "refreshToken is invalid",
          });
        } else {
          const { id } = data;

          const customer = await Customer.findOne({
            _id: id,
            isDeleted: false,
          })
            .select("-password")
            .lean();

          if (!customer) {
            res.status(400).json({
              statusCode: 400,
              message: "Lỗi không tìm thấy người dùng",
            });
          }
          const { _id, firstName, lastName, email } = customer;

          const token = generateToken({
            _id,
            firstName,
            lastName,
            email,
          });
          return res.status(200).json({
            message: "RefeshToken of user successfully",
            token,
          });
        }
      });
    } catch (err) {
      console.log("««««« err »»»»»", err);
      res.status(400).json({
        statusCode: 400,
        message: "Lỗi",
      });
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
