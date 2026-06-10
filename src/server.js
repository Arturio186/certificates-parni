require('dotenv').config();

const express = require('express');
const certificateRouter = require('./routes/certificate');
const domainGuard = require('./middleware/domainGuard');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/generateCertificate', domainGuard, certificateRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('[Server] Необработанная ошибка:', err);

  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   SKIP_ORIGIN_CHECK: ${process.env.SKIP_ORIGIN_CHECK}`);
  console.log(`   SMTP: ${process.env.SMTP_USER}\n`);
});

module.exports = app;