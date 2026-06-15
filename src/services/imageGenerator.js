const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TEXT_CONFIG = {
  code: {
    fontSize: 27,
    fontFamily: 'CertFont',
    color: '#2947F1',
    x: 640,
    y: 1850,
    fontWeight: 'bold',
  }
};

const loadFontAsBase64 = (fontFileName) => {
  const fontPath = path.resolve('fonts', fontFileName);

  if (!fs.existsSync(fontPath)) {
    throw new Error(`Шрифт не найден: ${fontPath}`);
  }

  const fontBuffer = fs.readFileSync(fontPath);
  return fontBuffer.toString('base64');
};

const getFontMime = (fontFileName) => {
  const ext = path.extname(fontFileName).toLowerCase();
  const mimes = {
    '.ttf': 'font/truetype',
    '.otf': 'font/opentype',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return mimes[ext] || 'font/truetype';
};

const buildSvgOverlay = (width, height, fields, fontConfig) => {
  const fontFaceBlock = fontConfig
    ? `
    <defs>
      <style>
        @font-face {
          font-family: '${fontConfig.family}';
          src: url('data:${fontConfig.mime};base64,${fontConfig.base64}') format('${fontConfig.format}');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: '${fontConfig.family}';
          src: url('data:${fontConfig.mime};base64,${fontConfig.base64Bold}') format('${fontConfig.format}');
          font-weight: bold;
          font-style: normal;
        }
      </style>
    </defs>`
    : '';

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
      >${escapeXml(text)}</text>`;
    })
    .join('');

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${fontFaceBlock}
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

const generateSingleImage = async ({ imagePath, width, height, fontConfig, code }) => {
  const fields = [
    {
      text: String(code),
      config: TEXT_CONFIG.code,
      imgWidth: width,
    },
  ].filter((f) => f.text);

  const svgOverlay = buildSvgOverlay(width, height, fields, fontConfig);

  const outputBuffer = await sharp(imagePath)
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .png()
    .toBuffer();

  console.log(`[ImageGenerator] Сертификат сгенерирован: код ${code} (${width}x${height}px)`);

  return outputBuffer;
};

/**
 * Генерирует картинки для массива кодов.
 * @param {object} params
 * @param {number} params.amount - Номинал (определяет шаблон)
 * @param {number[]} params.codes - Массив кодов сертификатов
 * @returns {Promise<Map<number, Buffer>>} Мапа: код → imageBuffer
 */
const generateCertificateImage = async ({ amount, codes }) => {
  const imagePath = path.resolve('images', `${amount}.png`);

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Шаблон для номинала ${amount} не найден: ${imagePath}`);
  }

  const metadata = await sharp(imagePath).metadata();
  const { width, height } = metadata;

  let fontConfig = null;

  try {
    const fontFileName = 'RFDewiExpanded-Bold.ttf';
    const base64 = loadFontAsBase64(fontFileName);

    fontConfig = {
      family: 'CertFont',
      base64,
      base64Bold: base64,
      mime: getFontMime(fontFileName),
      format: path.extname(fontFileName) === '.ttf' ? 'truetype' : 'opentype',
    };

    console.log('[ImageGenerator] Шрифт загружен успешно');
  } catch (err) {
    console.warn(`[ImageGenerator] Шрифт не загружен, используется системный: ${err.message}`);
  }

  const result = new Map();

  for (const code of codes) {
    const imageBuffer = await generateSingleImage({
      imagePath,
      width,
      height,
      fontConfig,
      code,
    });

    result.set(code, imageBuffer);
  }

  console.log(`[ImageGenerator] Готово: сгенерировано ${result.size} сертификатов`);

  return result;
};

module.exports = { generateCertificateImage };