// index.js - Full backend for NCC Certificate Generator using image templates

const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { createCanvas, loadImage } = require('canvas');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

const generateCertificate = async (templatePath, data, outputPath) => {
  const image = await loadImage(templatePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 28px Arial';

  // Change these coordinates based on your template
  ctx.fillText(data.rank, 819.4,675.6);
  ctx.fillText(data.name, 1186.8, 675.6);
  ctx.fillText(data.regtNo, 542.3, 735.4);
  ctx.fillText(data.unit, 502.8,799.6);
  ctx.fillText(data.event, 555, 420);
  ctx.fillText(data.position, 220, 460);
  ctx.fillText(data.date, 120, 530);
  ctx.fillText(data.place, 220, 560);
  ctx.fillText(data.certNo, 150, 600);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};

app.post('/generate-cert', upload.single('excel'), async (req, res) => {
  const file = req.file;
  const certType = req.body.certType || 'merit';

  if (!file) return res.status(400).send('No file uploaded');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file.path);
  const sheet = workbook.worksheets[0];

  const zipPath = path.join(__dirname, 'certificates.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip');
  archive.pipe(output);

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const data = {
      rank: row.getCell(1).value || '',
      name: row.getCell(2).value || '',
      regtNo: row.getCell(3).value || '',
      unit: row.getCell(4).value || '',
      event: row.getCell(5).value || '',
      position: row.getCell(6).value || '',
      date: row.getCell(7).value || '',
      place: row.getCell(8).value || '',
      certNo: row.getCell(9).value || '',
    };

    const filename = `${data.name}-${i}.png`;
    const outputPath = path.join(__dirname, filename);
    const certType = (req.body.certType || '').toLowerCase();
const wing = (req.body.wing || '').toLowerCase();

let templateName = '';

if (wing.includes('naval')) templateName += 'naval';
else if (wing.includes('girls')) templateName += 'girlsbn';
else if (wing.includes('air')) templateName += 'air';
else if (wing.includes('2 chd')) templateName += '2chdbn';

templateName += `-${certType}.png`;

const templatePath = path.join(__dirname, 'templates', templateName);


    await generateCertificate(templatePath, data, outputPath);
    archive.file(outputPath, { name: filename });
  }

  await archive.finalize();

  output.on('close', () => {
    res.download(zipPath, () => {
      fs.unlinkSync(zipPath);
      fs.unlinkSync(file.path);
    });
  });
});

app.listen(3000, () => {
  console.log('✅ Backend running at http://localhost:3000');
});