const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CANDIDATES = [
  process.env.PANDOC_PATH,
  'pandoc',
  path.join(process.env.LOCALAPPDATA || '', 'Pandoc', 'pandoc.exe'),
  'C:\\Program Files\\Pandoc\\pandoc.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Quarto', 'bin', 'tools', 'pandoc.exe'),
].filter(Boolean);

function resolvePandoc() {
  for (const candidate of CANDIDATES) {
    try {
      if (candidate !== 'pandoc' && !fs.existsSync(candidate)) continue;
      execFileSync(candidate, ['--version'], { stdio: 'pipe' });
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

module.exports = { resolvePandoc, CANDIDATES };