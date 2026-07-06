#!/usr/bin/env node
// Publish lender docs to octo-loan-docs repo: dated folder + md/docx/pdf.
//
// Usage:
//   node publish-docs.js
//   node publish-docs.js --skip-generate
//   node publish-docs.js --docs-repo ../octo-loan-docs

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { resolvePandoc } = require('./lib/resolve-pandoc');

const TOOL_DIR = __dirname;
const OUTPUT_DIR = path.join(TOOL_DIR, 'output');
const LOG_PATH = path.join(TOOL_DIR, 'data', 'dashboard-log.jsonl');
const DEFAULT_DOCS_REPO = path.join(TOOL_DIR, '..', 'octo-loan-docs');

const DOC_FILES = [
  { key: 'cover-letter', md: 'cover-letter.md' },
  { key: 'term-sheet', md: 'term-sheet.md' },
  { key: 'loan-agreement', md: 'loan-agreement.md' },
];

function parseArgs(argv) {
  const opts = { skipGenerate: false, docsRepo: DEFAULT_DOCS_REPO };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--skip-generate') opts.skipGenerate = true;
    if (argv[i] === '--docs-repo') opts.docsRepo = path.resolve(argv[++i]);
  }
  return opts;
}

function readLatestDashboardPull() {
  if (!fs.existsSync(LOG_PATH)) return null;
  const lines = fs.readFileSync(LOG_PATH, 'utf8').trim().split('\n').filter(Boolean);
  if (!lines.length) return null;
  return JSON.parse(lines[lines.length - 1]);
}

function runGenerateDocs() {
  const script = path.join(TOOL_DIR, 'generate-loan-docs.js');
  const res = spawnSync(process.execPath, [script], { cwd: TOOL_DIR, stdio: 'inherit' });
  if (res.status !== 0) throw new Error('generate-loan-docs.js failed');
}

function runIdFromTimestamp(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}Z`;
}

function dateFolderFromTimestamp(iso) {
  return iso.slice(0, 10);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function convertDocx(pandoc, srcMd, destDocx) {
  execFileSync(pandoc, [
    srcMd,
    '-f', 'markdown',
    '-t', 'docx',
    '-o', destDocx,
    '--standalone',
  ], { stdio: 'pipe' });
}

function convertPdf(pandoc, srcMd, destPdf) {
  // Try common PDF engines in order; pandoc alone needs an engine.
  const engines = ['wkhtmltopdf', 'weasyprint', 'pdflatex'];
  for (const engine of engines) {
    try {
      execFileSync(pandoc, [
        srcMd,
        '-f', 'markdown',
        '-o', destPdf,
        `--pdf-engine=${engine}`,
      ], { stdio: 'pipe' });
      return { engine };
    } catch {
      // next engine
    }
  }
  return null;
}

async function convertPdfViaMdToPdf(srcMd, destPdf) {
  let mdToPdf;
  try {
    ({ mdToPdf } = require('md-to-pdf'));
  } catch {
    return null;
  }
  await mdToPdf({ path: srcMd }, { dest: destPdf, pdf_options: { format: 'Letter', margin: '20mm' } });
  return { engine: 'md-to-pdf' };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pandoc = resolvePandoc();

  if (!opts.skipGenerate) {
    console.log('Generating markdown lender docs...');
    runGenerateDocs();
  }

  for (const { md } of DOC_FILES) {
    const src = path.join(OUTPUT_DIR, md);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing ${src} — run npm run docs first`);
    }
  }

  const pull = readLatestDashboardPull();
  const generatedAt = pull?.fetchedAt || new Date().toISOString();
  const dateFolder = dateFolderFromTimestamp(generatedAt);
  const runId = runIdFromTimestamp(generatedAt);

  const runRoot = path.join(opts.docsRepo, 'loan', dateFolder, runId);
  const mdDir = path.join(runRoot, 'markdown');
  const docxDir = path.join(runRoot, 'docx');
  const pdfDir = path.join(runRoot, 'pdf');

  ensureDir(mdDir);
  ensureDir(docxDir);
  ensureDir(pdfDir);

  const manifest = {
    package: 'loan',
    generated_at: generatedAt,
    published_at: new Date().toISOString(),
    source_tool: 'octo-loan-tool',
    source_repo: 'https://github.com/djackson74/octo-loan-tool',
    run_id: runId,
    dashboard: pull || null,
    converters: {
      docx: pandoc ? 'pandoc' : null,
      pdf: null,
    },
    files: {},
  };

  console.log(`Publishing to ${runRoot}`);

  if (!pandoc) {
    console.warn('WARNING: pandoc not found — markdown only (install: winget install JohnMacFarlane.Pandoc)');
  }

  for (const { key, md } of DOC_FILES) {
    const srcMd = path.join(OUTPUT_DIR, md);
    const destMd = path.join(mdDir, md);
    const destDocx = path.join(docxDir, md.replace(/\.md$/, '.docx'));
    const destPdf = path.join(pdfDir, md.replace(/\.md$/, '.pdf'));

    copyFile(srcMd, destMd);
    manifest.files[key] = {
      markdown: path.relative(opts.docsRepo, destMd).replace(/\\/g, '/'),
    };

    if (pandoc) {
      console.log(`  DOCX  ${key}`);
      convertDocx(pandoc, destMd, destDocx);
      manifest.files[key].docx = path.relative(opts.docsRepo, destDocx).replace(/\\/g, '/');
    }

    let pdfResult = pandoc ? convertPdf(pandoc, destMd, destPdf) : null;
    if (!pdfResult) {
      try {
        pdfResult = await convertPdfViaMdToPdf(destMd, destPdf);
        if (pdfResult) console.log(`  PDF   ${key} (md-to-pdf)`);
      } catch (err) {
        console.warn(`  PDF   ${key} skipped: ${err.message}`);
      }
    } else {
      console.log(`  PDF   ${key} (${pdfResult.engine})`);
    }

    if (pdfResult) manifest.converters.pdf = pdfResult.engine;
    if (fs.existsSync(destPdf)) {
      manifest.files[key].pdf = path.relative(opts.docsRepo, destPdf).replace(/\\/g, '/');
    }
  }

  // Copy supporting references
  const quotesSrc = path.join(TOOL_DIR, 'capex-quotes.json');
  if (fs.existsSync(quotesSrc)) {
    const quotesDest = path.join(runRoot, 'capex-quotes.json');
    copyFile(quotesSrc, quotesDest);
    manifest.capex_quotes = path.relative(opts.docsRepo, quotesDest).replace(/\\/g, '/');
  }

  const manifestPath = path.join(runRoot, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${manifestPath}`);

  // Update latest pointer for convenience
  const latestDir = path.join(opts.docsRepo, 'loan', 'latest');
  ensureDir(path.dirname(latestDir));
  const latest = {
    date: dateFolder,
    run_id: runId,
    path: path.relative(opts.docsRepo, runRoot).replace(/\\/g, '/'),
    generated_at: generatedAt,
    published_at: manifest.published_at,
  };
  fs.writeFileSync(path.join(opts.docsRepo, 'loan', 'latest.json'), JSON.stringify(latest, null, 2) + '\n', 'utf8');

  console.log('\nDone. Commit and push octo-loan-docs when ready.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});