#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const appConfigPath = path.join(__dirname, '..', 'app.config.ts');

function incrementVersionCode() {
  const content = fs.readFileSync(appConfigPath, 'utf8');
  const versionCodePattern = /^(\s*versionCode:\s*)(\d+)(,?\s*)$/m;
  const versionCodeMatch = content.match(versionCodePattern);

  if (!versionCodeMatch) {
    console.error('versionCode not found in app.config.ts');
    process.exit(1);
  }

  const currentVersionCode = Number(versionCodeMatch[2]);
  const newVersionCode = currentVersionCode + 1;
  const updatedContent = content.replace(
    versionCodePattern,
    `$1${newVersionCode}$3`,
  );

  fs.writeFileSync(appConfigPath, updatedContent);

  console.log(`versionCode incremented: ${currentVersionCode} -> ${newVersionCode}`);
}

incrementVersionCode();