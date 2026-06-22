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


const sendCertificateEmail = async ({to, amount, imageBufferByCode}) => {
  const transporter = getTransporter();

  const attachments = [...imageBufferByCode.entries()].map(([code, buffer]) => ({
    filename: `certificate-${code}.png`,
    content: buffer,
    contentType: 'image/png',
  }));

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Тот самый подарок`,
    html: buildEmailHtml(),
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log(`[Mailer] Письмо отправлено: ${info.messageId} → ${to}, вложений: ${attachments.length}`);

  return info;
};


const buildEmailHtml = () => `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Тот самый подарок</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f4f4f4;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
  "
>

<table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  bgcolor="#f4f4f4"
  style="background:#f4f4f4;"
>
<tr>
<td align="center" style="padding:36px;">

<table
  role="presentation"
  width="600"
  cellpadding="0"
  cellspacing="0"
  border="0"
  bgcolor="#ffffff"
  style="
    background:#ffffff;
    border-radius:18px;
    overflow:hidden;
    width:600px;
    max-width:600px;
  "
>

<tr>
<td
  style="
    height:46px;
    border-bottom:1px solid #e6e6e6;
    padding:0 24px;
  "
>

<table
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  border="0"
>
<tr>
<td
  width="10"
  height="10"
  style="
    width:10px;
    height:10px;
    border-radius:50%;
    background:#e94b10;
  "
></td>

<td width="8"></td>

<td
  width="10"
  height="10"
  style="
    width:10px;
    height:10px;
    border-radius:50%;
    background:#e9e9e9;
  "
></td>

<td width="8"></td>

<td
  width="10"
  height="10"
  style="
    width:10px;
    height:10px;
    border-radius:50%;
    background:#d0ee57;
  "
></td>
</tr>
</table>

</td>
</tr>

<tr>
<td style="padding:54px 42px 48px;">

<h1
  style="
    margin:0 0 34px;
    color:#2947f1;
    font-size:20px;
    line-height:1.2;
    font-weight:700;
  "
>
Привет!
</h1>

<p
  style="
    margin:0 0 34px;
    color:#2947f1;
    font-size:16px;
    line-height:1.75;
    font-weight:600;
  "
>
Твои электронные носки готовы к отправке парню.
</p>

<p
  style="
    margin:0 0 34px;
    color:#2947f1;
    font-size:16px;
    line-height:1.75;
    font-weight:600;
  "
>
Файл с электронным сертификатом прикреплен к этому письму.
Его можно переслать счастливчику, либо распечатать
и подарить при встрече.
</p>

<p
  style="
    margin:0 0 34px;
    color:#2947f1;
    font-size:16px;
    line-height:1.75;
    font-weight:600;
  "
>
Ждем его на стрижки, уходы и полный ресет.
</p>

<p
  style="
    margin:0;
    color:#2947f1;
    font-size:16px;
    line-height:1.75;
    font-weight:600;
  "
>
Остаемся на связи,<br>
команда ПАРНИ
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

module.exports = {sendCertificateEmail};