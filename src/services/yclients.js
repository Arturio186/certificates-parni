const createCertificate = async ({ amount, recipientEmail }) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockCode = `645771`;

  console.log(`[YClients] Создан сертификат (МОК): ${mockCode}`);

  return {
    code: mockCode,
    amount,
    recipientEmail,
    createdAt: new Date().toISOString(),
  };
};

module.exports = { createCertificate };