const getHeaders = () => ({
  Authorization: `Bearer ${process.env.YCLIENTS_TOKEN}, User ${process.env.YCLIENTS_USER_TOKEN}`,
  'Content-Type': 'application/json',
  Accept: 'application/vnd.api.v2+json',
});

const findGoodByAmount = async (amount) => {
  const url = `https://api.yclients.com/api/v1/goods/${process.env.YCLIENTS_COMPANY_ID}?term=API`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[YClients] Ошибка получения товаров: ${response.status} — ${errText}`);
  }

  const json = await response.json();

  if (!json.success || !Array.isArray(json.data)) {
    throw new Error(`[YClients] Неожиданный ответ от goods: ${JSON.stringify(json)}`);
  }

  const match = json.data.find(
    (item) => item.loyalty_certificate_type?.balance === amount
  );

  if (!match) {
    throw new Error(
      `[YClients] Сертификат с номиналом ${amount} не найден среди ${json.data.length} товаров`
    );
  }

  // Проверяем наличие actual_amounts и первого элемента
  if (
    !Array.isArray(match.actual_amounts) ||
    match.actual_amounts.length === 0
  ) {
    throw new Error(
      `[YClients] actual_amounts отсутствует или пуст для товара good_id=${match.good_id}`
    );
  }

  const storageId = match.actual_amounts[0].storage_id;

  if (storageId === undefined || storageId === null) {
    throw new Error(
      `[YClients] storage_id отсутствует в actual_amounts[0] для товара good_id=${match.good_id}`
    );
  }

  console.log(
    `[YClients] Найден товар: "${match.title}", good_id=${match.good_id}, balance=${match.loyalty_certificate_type.balance}, storage_id=${storageId}`
  );

  return { goodId: match.good_id, storageId };
};

const generateCode = async (goodId) => {
  const url = `https://api.yclients.com/api/v1/loyalty/generate_code/${process.env.YCLIENTS_COMPANY_ID}/${goodId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[YClients] Ошибка генерации кода: ${response.status} — ${errText}`);
  }

  const json = await response.json();
  const code = json.data.code;

  console.log('[YClients] Код сгенерирован:', code);

  return code;
};


const createStorageOperation = async ({ goodId, storageId, amount, code }) => {
  const url = `https://api.yclients.com/api/v1/storage_operations/operation/${process.env.YCLIENTS_COMPANY_ID}`;

  const body = {
    type_id: 1,
    create_date: Math.floor(Date.now() / 1000),
    storage_id: storageId,
    master_id: process.env.YCLIENTS_MASTER_ID,
    goods_transactions: [
      {
        good_id: goodId,
        amount: 1,
        discount: 0,
        cost_per_unit: amount,
        cost: amount,
        operation_unit_type: 1,
        good_special_number: code,
      },
    ],
  };

  console.log('[YClients] Создаём складскую операцию');

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[YClients] Ошибка создания складской операции: ${response.status} — ${errText}`);
  }

  const json = await response.json();

  console.log('[YClients] Складская операция успешно создана');

  return json;
};

const createCertificate = async ({ amount, recipientEmail }) => {
  const { goodId, storageId } = await findGoodByAmount(amount);

  const code = await generateCode(goodId);

  await createStorageOperation({ goodId, storageId, amount, code });

  console.log(`[YClients] Итоговый код сертификата: ${code}`);

  return {
    code,
    amount,
    recipientEmail,
    createdAt: new Date().toISOString(),
  };
};

module.exports = { createCertificate };