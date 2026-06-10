const nodemailer = require('nodemailer');

/**
 * Создаём транспорт один раз при старте (переиспользуем соединение).
 * SSL на 465.
 */
const createTransport = () =>
  nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true, // SSL
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

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Ваш подарочный сертификат на ${amount} ₽`,
    html: buildEmailHtml({ amount, code }),
    attachments: [
      {
        filename: `certificate-${code}.png`,
        content: imageBuffer,
        contentType: 'image/png',
        // Встраиваем в письмо как inline-изображение
        cid: 'certificate_image',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Письмо отправлено: ${info.messageId} → ${to}`);

  return info;
};

const buildEmailHtml = ({ amount, code }) => `
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
          
          <!-- Заголовок -->
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

          <!-- Картинка сертификата -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <img 
                src="cid:certificate_image" 
                alt="Сертификат на ${amount} ₽" 
                style="max-width:100%; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);"
              />
            </td>
          </tr>

          <!-- Текст -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <p style="font-size:15px; color:#555; line-height:1.6;">
                Вам вручён подарочный сертификат. Используйте код ниже при записи.
              </p>
              
              <!-- Код сертификата -->
              <div style="display:inline-block; background:#f8f8f8; border:2px dashed #FFD700; border-radius:8px; padding: 16px 40px; margin: 20px 0;">
                <p style="margin:0; font-size:12px; color:#999; text-transform:uppercase; letter-spacing:1px;">Код сертификата</p>
                <p style="margin: 8px 0 0; font-size:24px; font-weight:bold; color:#1a1a2e; letter-spacing:3px;">${code}</p>
              </div>
            </td>
          </tr>

          <!-- Подвал -->
          <tr>
            <td style="background:#f8f8f8; padding: 20px 40px; text-align:center; border-top: 1px solid #eee;">
              <p style="margin:0; font-size:13px; color:#999;">
                Сертификат выслан автоматически. По вопросам обращайтесь к нам.
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