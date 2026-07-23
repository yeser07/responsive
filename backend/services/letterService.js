const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const fse = require('fs-extra');
const Assignment = require('../models/assignment');
const Letter = require('../models/letter');
const LetterTemplate = require('../models/letterTemplate');

async function getTemplateSettings() {
  let template = await LetterTemplate.findOne({ key: 'default' });
  if (!template) {
    template = await LetterTemplate.create({ key: 'default' });
  }
  return template;
}

function formatLongDate(value) {
  const date = value ? new Date(value) : new Date();
  const formatted = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  // "29 de junio de 2026" → "29 de junio del 2026"
  return formatted.replace(/ de (\d{4})$/, ' del $1');
}

async function compileTemplate(data) {
  const templatePath = path.join(__dirname, '..', 'templates', 'assignmentLetter.hbs');
  const html = fs.readFileSync(templatePath, 'utf8');
  return handlebars.compile(html)(data);
}

function resolveBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')
      : null,
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      : null,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function createAssignmentLetter(assignmentId, assigneeSignatureDataUrl) {
  const assignment = await Assignment.findById(assignmentId)
    .populate('userOwnerId')
    .populate('configurationItemId')
    .populate('reviewerId');

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (!assignment.reviewerId) {
    throw new Error('Reviewer is required to generate a letter');
  }

  const existingLetter = await Letter.findOne({ assignmentId });
  if (existingLetter) {
    const error = new Error('Letter already exists for this assignment');
    error.code = 'LETTER_EXISTS';
    error.letter = existingLetter;
    throw error;
  }

  const user = assignment.userOwnerId;
  const ci = assignment.configurationItemId;
  const reviewer = assignment.reviewerId;
  const settings = await getTemplateSettings();
  const equipmentType = ci?.className || 'equipo';
  const legalText = String(settings.legalText || '').replaceAll(
    '{equipmentType}',
    equipmentType
  );
  const accessories = Array.isArray(assignment.accessories) ? assignment.accessories : [];
  const accessoriesText = accessories.length ? accessories.join(', ') : 'N/A';
  const equipmentModel = [ci?.brandName, ci?.modelName].filter(Boolean).join(' ').trim() || 'N/A';

  const html = await compileTemplate({
    companyName: settings.companyName,
    title: settings.title,
    legalText,
    logoDataUrl: settings.logoDataUrl || null,
    reviewedByName: reviewer?.name || 'N/A',
    reviewedByTitle: reviewer?.title || '',
    reviewerSignature: reviewer?.signatureDataUrl || null,
    assigneeName: user?.name || 'N/A',
    jobDescription: user?.jobDescription || '',
    date: formatLongDate(assignment.assignmentDate),
    equipmentModel,
    serialNumber: ci?.serialNumber || '',
    accessoriesText,
    assigneeSignature: assigneeSignatureDataUrl || null,
  });

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  await fse.ensureDir(uploadsDir);

  const fileName = `assignment_${assignmentId}_${Date.now()}.pdf`;
  const pdfPath = path.join(uploadsDir, fileName);

  const executablePath = resolveBrowserExecutable();
  const browser = await puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
  } finally {
    await browser.close();
  }

  const letter = await Letter.create({
    assignmentId,
    filePath: pdfPath,
    fileName,
  });

  return letter;
}

module.exports = { createAssignmentLetter, compileTemplate, getTemplateSettings };
