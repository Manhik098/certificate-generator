const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { createCanvas, loadImage } = require('canvas');

// Load config files
const { meritConfigs } = require('./configs/merit.js');
const { participationConfigs } = require('./configs/participation.js');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: 'uploads/' });

const allConfigs = {
  ...meritConfigs,
  ...participationConfigs,
};

app.use('/templates', express.static(path.join(__dirname, 'templates')));

// ✅ Wing name mapping helper
const getWingKey = (wing) => {
  const lower = wing.toLowerCase();
  if (lower.includes('naval')) return 'naval';
  if (lower.includes('girls')) return 'girlsbn';
  if (lower.includes('air')) return 'air';
  if (lower.includes('2 chd')) return '2chdbn';
  return ''; // fallback if not matched
};

const generateCertificate = async (templatePath, data, coords, outputPath) => {
  const image = await loadImage(templatePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 28px Arial';

  Object.keys(coords).forEach((key) => {
    if (data[key] !== undefined) {
      const [x, y] = coords[key];
      let value = data[key];

      if (key === 'date' || key === 'from' || key === 'to') {
        try {
          const d = new Date(value);
          value = d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        } catch (err) {}
      }

      ctx.fillText(String(value), x, y);
    }
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};

app.post('/generate-cert', upload.single('excel'), async (req, res) => {
  const file = req.file;
  const certType = (req.body.certType || '').toLowerCase();
  const wing = req.body.wing || '';
  const wingKey = getWingKey(wing);

  if (!file) return res.status(400).send('No file uploaded');

  const templateKey = `${wingKey}-${certType}`;
  const config = allConfigs[templateKey];

  if (!config) {
    return res.status(400).send(`Unknown certificate type: ${templateKey}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file.path);
  const sheet = workbook.worksheets[0];

  const zipPath = path.join(__dirname, 'certificates.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip');
  archive.pipe(output);

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const data = {};

    config.fields.forEach((field, idx) => {
      const cellVal = row.getCell(idx + 1).value;
      data[field] = cellVal || '';
    });

    const filename = `${data.name}-${i}.png`;
    const outputPath = path.join(__dirname, filename);

    const templatePath = path.join(__dirname, 'templates', `${templateKey}.png`);
    await generateCertificate(templatePath, data, config.coords, outputPath);
    archive.file(outputPath, { name: filename });
  }

  await archive.finalize();

  output.on('close', () => {
    res.download(zipPath, () => {
      fs.unlinkSync(zipPath);
      fs.unlinkSync(file.path);

      fs.readdirSync(__dirname)
        .filter((f) => f.endsWith('.png') && f !== 'templates')
        .forEach((f) => fs.unlinkSync(path.join(__dirname, f)));
    });
  });
});

app.listen(3000, () => {
  console.log('✅ Backend running at http://localhost:3000');
});
