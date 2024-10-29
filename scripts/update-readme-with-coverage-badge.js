/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '../README.md');
const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');

const readme = fs.readFileSync(readmePath, 'utf8');
const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

const coverageRegex =
  /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/Coverage-([.?\d]+)%25-brightgreen\.svg\)/;

const currentPercent = readme.match(coverageRegex)[1];
const coveragePercent = coverage.total.lines.pct.toString();

if (coveragePercent <= 0 || currentPercent === coveragePercent) {
  console.log('No coverage changes, skipping readme updates');
  return;
}

try {
  const coverageBadge = `![Coverage](https://img.shields.io/badge/Coverage-${coveragePercent}%25-brightgreen.svg)`;

  const newReadme = readme.replace(coverageRegex, coverageBadge);

  fs.writeFileSync(readmePath, newReadme);

  console.log('Updated the coverage badge');
} catch {
  console.log('An error ocurred while updating the readme');
}
