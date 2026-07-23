const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const fse = require('fs-extra');
const Assignment = require('../models/assignment');
const Letter = require('../models/letter');

async function compileTemplate(data) {
  const templatePath = path.join(__dirname, '..', 'templates', 'assignmentLetter.hbs');
  const html = fs.readFileSync(templatePath, 'utf8');
  return handlebars.compile(html)(data);
}

async function createAssignmentLetter(assignmentId, signatureDataUrl) {
  const assignment = await Assignment.findById(assignmentId)
    .populate('userOwnerId')
    .populate('configurationItemId');

  if (!assignment) {
    throw new Error('Assignment not found');
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

  const html = await compileTemplate({
    assigneeName: user?.name || 'N/A',
    logonUser: user?.logonUser || '',
    jobDescription: user?.jobDescription || '',
    date: new Date(assignment.assignmentDate).toLocaleDateString('es-HN'),
    className: ci?.className || '',
    serialNumber: ci?.serialNumber || '',
    brandName: ci?.brandName || '',
    modelName: ci?.modelName || '',
    location: ci?.location || '',
    accessories: assignment.accessories || [],
    signature: signatureDataUrl || null,
  });

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  await fse.ensureDir(uploadsDir);

  const fileName = `assignment_${assignmentId}_${Date.now()}.pdf`;
  const pdfPath = path.join(uploadsDir, fileName);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
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

module.exports = { createAssignmentLetter, compileTemplate };
