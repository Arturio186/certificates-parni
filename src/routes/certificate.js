const { Router } = require('express');
const { createCertificate } = require('../services/yclients');
const { generateCertificateImage } = require('../services/imageGenerator');
const { sendCertificateEmail } = require('../services/mailer');

const router = Router();

router.post('/', async (req, res) => {
  const { amount, recipientEmail, quantity } = req.body;

  console.log(req.body);

  // --- Валидация ---
  if (!amount || !recipientEmail || !quantity) {
    return res.status(400).json({
      success: false,
      error: 'Поля amount, recipientEmail и quantity обязательны',
    });
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: 'quantity должен быть положительным числом',
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'amount должен быть положительным числом',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Некорректный email',
    });
  }

  res.status(202).json({
    success: true,
    message: 'Сертификат создаётся, письмо будет отправлено',
  });

  processCertificate({ amount, recipientEmail, quantity }).catch((err) => {
    console.error('[Certificate] Ошибка при обработке сертификата:', err);
  });
});

const processCertificate = async ({ amount, recipientEmail, quantity }) => {
  console.log(`[Certificate] Начало обработки: amount=${amount}, email=${recipientEmail}`);

  const certificate = await createCertificate({ amount, recipientEmail, quantity });
  console.log(`[Certificate] Шаг 1 ✓ Коды: ${certificate.codes}`);

  const imageBufferByCode = await generateCertificateImage({
    amount,
    codes: certificate.codes
  });
  console.log(`[Certificate] Шаг 2 ✓ Картинки сгенерированы`);

  await sendCertificateEmail({
    to: recipientEmail,
    amount,
    code: certificate.code,
    imageBufferByCode,
  });
  console.log(`[Certificate] Шаг 3 ✓ Письмо отправлено на ${recipientEmail}`);

  console.log(`[Certificate] ✅ Готово!`);
};

module.exports = router;