const { createAssignmentLetter } = require('../services/letterService');

const queue = [];
let processing = false;

async function processNext() {
  if (processing || !queue.length) return;
  processing = true;
  const job = queue.shift();
  try {
    const letter = await createAssignmentLetter(job.assignmentId, job.signatureDataUrl);
    job.resolve(letter);
  } catch (error) {
    job.reject(error);
  } finally {
    processing = false;
    processNext();
  }
}

function enqueueLetter(assignmentId, signatureDataUrl) {
  return new Promise((resolve, reject) => {
    queue.push({ assignmentId, signatureDataUrl, resolve, reject });
    processNext();
  });
}

function getQueueStats() {
  return { pending: queue.length, processing };
}

module.exports = { enqueueLetter, getQueueStats };
