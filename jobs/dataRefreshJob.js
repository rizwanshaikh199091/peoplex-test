const cron = require('node-cron');
const importCsv = require('../utils/importCsv');
const fs = require('fs');
const path = require('path');
const LOG_FILE = path.join(__dirname, '../logs/data_refresh.log');

function logRefresh(status, message) {
  const logEntry = `[${new Date().toISOString()}] [${status}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

async function refreshData(filePath) {
  try {
    await importCsv(filePath);
    logRefresh('SUCCESS', `Data refreshed from ${filePath}`);
  } catch (err) {
    logRefresh('FAIL', `Error refreshing data from ${filePath}: ${err.message}`);
  }
}

function scheduleDailyRefresh(filePath) {
  cron.schedule('0 2 * * *', () => {
    refreshData(filePath);
  });
}

module.exports = { refreshData, scheduleDailyRefresh, logRefresh };