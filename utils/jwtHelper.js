const JWT = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const jwtSettings = require("../constants/jwtSetting");

const generateToken = (user) => {
  const expiresIn = "30d";
  return JWT.sign(
    {
      iat: Math.floor(Date.now() / 1000),
      ...user, //user được trả dữ liệu về theo quy định lúc nhận đối số
    },
    jwtSettings.SECRET,
    {
      expiresIn,
    }
  );
};

const generateRefreshToken = (id) => {
  const expiresIn = "30d";
  return JWT.sign({ id }, jwtSettings.SECRET, { expiresIn });
};

// Logic tạo mã xác thực của bạn ở đây
const generateVerificationCode = () => {
  const expiresIn = "10m"; // Mã xác thực hết hạn sau 10 phút
  return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};

const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vothang226@gmail.com", // Địa chỉ email Gmail của bạn
        pass: "pnnj uhco dqjd hinx", // Mật khẩu ứng dụng của bạn
      },
    });

    const mailOptions = {
      from: "vothang226@gmail.com", // Địa chỉ email người gửi
      to: email, // Địa chỉ email người nhận
      subject: "Xác thực địa chỉ email của bạn vào JOLLIBEE FAKE",
      text: `Mã xác thực của bạn là: ${verificationCode}`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateVerificationCode,
  sendVerificationEmail,
};
