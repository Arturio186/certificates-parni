const domainGuard = (req, res, next) => {
  // const origin = req.headers['origin'] || req.headers['referer'] || '';

  // if (process.env.SKIP_ORIGIN_CHECK === 'true') {
  //   return next();
  // }

  // const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  //   .split(',')
  //   .map((o) => o.trim())
  //   .filter(Boolean);

  // const isAllowed = allowedOrigins.some((allowed) => origin.startsWith(allowed));

  // if (!isAllowed) {
  //   console.warn(`[domainGuard] Заблокирован запрос с origin: "${origin}"`);
  //   return res.status(403).json({
  //     success: false,
  //     error: 'Forbidden: origin not allowed',
  //   });
  // }
  
  const webhookSecret = process.env.WEBHOOK_SECRET;

  const incomingSecret = req.headers['x-webhook-secret'];
  
  if (incomingSecret !== webhookSecret) {
    console.warn('[domainGuard] Неверный webhook secret');
    return res.status(403).json({
      success: false,
      error: 'Forbidden: invalid secret',
    });
  }

  next();
};

module.exports = domainGuard;