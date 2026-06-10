/**
 * Сервис YClients.
 * Пока мок — возвращает сгенерированный код сертификата.
 * TODO: заменить на реальный API вызов.
 */

const createCertificate = async ({ amount, recipientEmail }) => {
  // --- МОК ---
  // Имитируем задержку сети
  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockCode = `645771`;

  console.log(`[YClients] Создан сертификат (МОК): ${mockCode}`);

  return {
    code: mockCode,
    amount,
    recipientEmail,
    createdAt: new Date().toISOString(),
  };

  // --- РЕАЛЬНЫЙ КОД (раскомментировать потом) ---
  /*
  const response = await fetch('https://api.yclients.com/api/v1/certificates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.YCLIENTS_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      company_id: process.env.YCLIENTS_COMPANY_ID,
      amount,
      email: recipientEmail,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`YClients API error: ${err}`);
  }

  const data = await response.json();
  return data;
  */
};

module.exports = { createCertificate };