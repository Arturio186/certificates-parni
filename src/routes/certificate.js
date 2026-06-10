const { Router } = require('express');
const { createCertificate } = require('../services/yclients');
const { generateCertificateImage } = require('../services/imageGenerator');
const { sendCertificateEmail } = require('../services/mailer');

const router = Router();

/**
 * POST /generateCertificate
 *
 * Body:
 * {
 *   amount: 3000,              // номинал (должна быть картинка images/3000.png)
 *   recipientEmail: "...",     // куда слать
 * }
 */
router.post('/', async (req, res) => {
  const { amount, recipientEmail } = req.body;

  // --- Валидация ---
  if (!amount || !recipientEmail) {
    return res.status(400).json({
      success: false,
      error: 'Поля amount и recipientEmail обязательны',
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

  // --- Отвечаем клиенту сразу (не ждём тяжёлых операций) ---
  // Вебхук получает ответ мгновенно, работа идёт в фоне.
  res.status(202).json({
    success: true,
    message: 'Сертификат создаётся, письмо будет отправлено',
  });

  // --- Фоновая обработка ---
  processCertificate({ amount, recipientEmail }).catch((err) => {
    console.error('[Certificate] Ошибка при обработке сертификата:', err);
  });
});

/**
 * Вся тяжёлая работа — асинхронно, не блокирует event loop.
 */
const processCertificate = async ({ amount, recipientEmail }) => {
  console.log(`[Certificate] Начало обработки: amount=${amount}, email=${recipientEmail}`);

  // Шаг 1: YClients — создаём сертификат, получаем код
  const certificate = await createCertificate({ amount, recipientEmail });
  console.log(`[Certificate] Шаг 1 ✓ Код: ${certificate.code}`);

  // Шаг 2: Генерация картинки
  const imageBuffer = await generateCertificateImage({
    amount,
    code: certificate.code
  });
  console.log(`[Certificate] Шаг 2 ✓ Картинка сгенерирована (${imageBuffer.length} bytes)`);

  // Шаг 3: Отправка на почту
  await sendCertificateEmail({
    to: recipientEmail,
    amount,
    code: certificate.code,
    imageBuffer,
  });
  console.log(`[Certificate] Шаг 3 ✓ Письмо отправлено на ${recipientEmail}`);

  console.log(`[Certificate] ✅ Готово! Сертификат ${certificate.code} выслан.`);
};

module.exports = router;