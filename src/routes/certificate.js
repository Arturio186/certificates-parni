const { Router } = require('express');
const { createCertificate } = require('../services/yclients');
const { generateCertificateImage } = require('../services/imageGenerator');
const { sendCertificateEmail } = require('../services/mailer');

const router = Router();

const amountMap = {
  3000: 3000,
  8000: 5000,
  13000: 10000,
  18000: 15000,
  23000: 20000
};

router.post('/', async (req, res) => {
  if (req.body.test === 'test') {
    return res.status(200).json({
      success: true,
      message: 'hello tilda!!!',
    });
  }

  const { email: recipientEmail } = req.body;

  const quantity = req.body.quantity ?? 1;
  const amount = amountMap[Number(req.body.amount)];

  // --- Валидация ---
  if (!recipientEmail || !req.body.payment?.products?.length) {
    return res.status(400).json({
      success: false,
      error: 'Поля email и payment.products обязательны',
    });
  }

  console.log(req.body.payment.products);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Некорректный email',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Сертификат создаётся, письмо будет отправлено',
  });

  Promise.all(req.body.payment.products.map(product => {
    return processCertificate({ amount: Number(product.price), recipientEmail, quantity: product.quantity })
      .catch((err) => {
        console.error('[Certificate] Ошибка при обработке сертификата:', err);
      })
  }))
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