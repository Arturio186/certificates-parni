const nodemailer = require('nodemailer');

const createTransport = () =>
  nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = createTransport();
  }
  return _transporter;
};

/**
 * Отправляет письмо с сертификатом.
 * @param {object} params
 * @param {string} params.to - Email получателя
 * @param {number} params.amount - Номинал
 * @param {string} params.code - Код сертификата
 * @param {Buffer} params.imageBuffer - PNG-буфер картинки
 */
const sendCertificateEmail = async ({ to, amount, code, imageBuffer }) => {
  const transporter = getTransporter();

  const filename = `certificate-${code}.png`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Ваш подарочный сертификат на ${amount} ₽`,
    html: buildEmailHtml({ amount, code, filename }),
    attachments: [
      {
        filename,
        content: imageBuffer,
        contentType: 'image/png',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Письмо отправлено: ${info.messageId} → ${to}`);

  return info;
};

const buildEmailHtml = ({ amount, code, filename }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подарочный сертификат</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 36px 40px 10px; text-align: center;">
              <p style="font-size:17px; color:#333; line-height:1.7; margin: 0 0 16px;">
                Привет! 👋
              </p>
              <p style="font-size:15px; color:#555; line-height:1.8; margin: 0 0 12px;">
                Это сертифкат бла бла его можно скачать и все такое (текст позже пропишем детально)
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = { sendCertificateEmail };