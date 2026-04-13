// Startup: copy seed DB to persistent disk on first deploy
const fs = require('fs');
const path = require('path');

const dataDir = process.env.DATA_DIR;
if (dataDir) {
  const dest = path.join(dataDir, 'pickleball.db');
  const seed = path.join(__dirname, 'pickleball.db');
  if (!fs.existsSync(dest) && fs.existsSync(seed)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(seed, dest);
    console.log('Đã copy DB từ seed sang', dest);
  }
}

require('./index.js');
