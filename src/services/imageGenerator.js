const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Настройки текста на картинке.
 * Меняй под свой дизайн.
 */
const TEXT_CONFIG = {
  // Код сертификата
  code: {
    fontSize: 27,
    fontFamily: 'Arial',
    color: '#2947F1',
    x: 640,
    y: 1892,
    fontWeight: 'bold',
  }
};

/**
 * Строит SVG-оверлей с текстом поверх картинки.
 */
const buildSvgOverlay = (width, height, fields) => {
  const textElements = fields
    .map(({ text, config, imgWidth }) => {
      const x = config.x === 'center' ? Math.round(imgWidth / 2) : config.x;
      const anchor = config.x === 'center' ? 'middle' : 'start';

      return `
      <text
        x="${x}"
        y="${config.y}"
        font-size="${config.fontSize}"
        font-family="${config.fontFamily}"
        font-weight="${config.fontWeight}"
        fill="${config.color}"
        text-anchor="${anchor}"
        dominant-baseline="middle"
        style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8))"
      >${escapeXml(text)}</text>
    `;
    })
    .join('');

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${textElements}
    </svg>
  `);
};

const escapeXml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Генерирует картинку сертификата.
 * @returns {Promise<Buffer>} PNG-буфер
 */
const generateCertificateImage = async ({ amount, code }) => {
  const imagePath = path.resolve('images', `${amount}.png`);

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Шаблон для номинала ${amount} не найден: ${imagePath}`);
  }

  // Получаем размеры оригинального изображения
  const metadata = await sharp(imagePath).metadata();
  const { width, height } = metadata;

  // Формируем поля для наложения
  const fields = [
    {
      text: code,
      config: TEXT_CONFIG.code,
      imgWidth: width,
    },
  ].filter((f) => f.text); // убираем пустые поля

  const svgOverlay = buildSvgOverlay(width, height, fields);

  // Накладываем SVG поверх картинки
  const outputBuffer = await sharp(imagePath)
    .composite([
      {
        input: svgOverlay,
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  console.log(`[ImageGenerator] Сертификат сгенерирован (${width}x${height}px)`);

  return outputBuffer;
};

module.exports = { generateCertificateImage };