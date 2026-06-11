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
            <td style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; text-align: center;">
              <h1 style="color:#FFD700; margin:0; font-size:28px; letter-spacing:2px;">
                🎁 Подарочный сертификат
              </h1>
              <p style="color:#ccc; margin: 10px 0 0; font-size:16px;">
                Номинал: <strong style="color:#FFD700;">${amount} ₽</strong>
              </p>
            </td>
          </tr>

          <!-- Основной текст -->
          <tr>
            <td style="padding: 36px 40px 10px; text-align: center;">
              <p style="font-size:17px; color:#333; line-height:1.7; margin: 0 0 16px;">
                Привет! 👋
              </p>
              <p style="font-size:15px; color:#555; line-height:1.8; margin: 0 0 12px;">
                Это сертифкат бла бла его можно скачать и все такое (текст позже пропишем детально)
              </p>
              <p style="font-size:15px; color:#555; line-height:1.8; margin: 0 0 12px;">
                Сертификат прикреплён к этому письму в виде файла <strong>${filename}</strong> — 
                его можно скачать, распечатать или показать с экрана при визите.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 36px; text-align: center;">
              <div style="display:inline-block; background:#f8f8f8; border:2px dashed #FFD700; border-radius:8px; padding: 16px 40px;">
                <p style="margin:0; font-size:12px; color:#999; text-transform:uppercase; letter-spacing:1px;">
                  Код сертификата
                </p>
                <p style="margin: 8px 0 0; font-size:28px; font-weight:bold; color:#1a1a2e; letter-spacing:4px;">
                  ${code}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#f8f8f8; padding: 20px 40px; text-align:center; border-top: 1px solid #eee;">
              <p style="margin:0; font-size:13px; color:#999;">
                Письмо отправлено автоматически. По вопросам обращайтесь к нам.
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