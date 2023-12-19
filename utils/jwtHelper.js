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
  const createdAt = new Date();
  const expiresIn = 3 * 60 * 1000;
  const expirationTime = createdAt.getTime() + expiresIn;

  return {
    code: Math.floor(Math.random() * (999999 - 100000 + 1) + 100000),
    createdAt,
    expiresIn,
    expirationTime,
  };
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
    // Tính thời gian hiệu lực của mã xác thực (10 phút)
    const expiresInMinutes = 3;

    // Tạo đoạn mã HTML cho email
    const emailHTML = `
      <p>Mã xác thực của bạn là: <strong>${verificationCode}</strong></p>
      <p>Mã xác thực này có hiệu lực trong vòng ${expiresInMinutes} phút.</p>
      <p>Vui lòng không chia sẻ mã này với người khác.</p>
    `;

    const mailOptions = {
      from: "vothang226@gmail.com", // Địa chỉ email người gửi
      to: email, // Địa chỉ email người nhận
      subject: "Xác thực địa chỉ email của bạn vào JOLLIBEE FAKE",
      html: emailHTML, // Sử dụng HTML cho nội dung email
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
