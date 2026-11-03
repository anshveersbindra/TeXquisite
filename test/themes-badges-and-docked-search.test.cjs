const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Find & replace panel is docked at bottom and styled without overflow', () => {
  const renderer = fs.readFileSync(path.join(__dirname, '../src/renderer.ts'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../media/app.css'), 'utf8');

  // Verify search extension is docked at bottom (top: false)
  assert.match(renderer, /search\(\{\s*top:\s*false\s*\}\)/);

  // Verify CSS positions .cm-panel.cm-search as static docked full-width bar
  assert.match(css, /\.cm-panel\.cm-search\s*\{[\s\S]*?position:\s*static/);
  assert.match(css, /\.cm-panel\.cm-search\s*\{[\s\S]*?width:\s*100%/);
  assert.match(css, /\.cm-panels\.cm-panels-bottom/);
});

test('Preferences dialog supports backdrop click dismiss and preserves toolbar SVG icons', () => {
  const renderer = fs.readFileSync(path.join(__dirname, '../src/renderer.ts'), 'utf8');

  // Backdrop click listener
  assert.match(renderer, /settingsDialogEl\.onclick\s*=\s*\(e\)\s*=>\s*\{[\s\S]*?if\s*\(e\.target\s*===\s*settingsDialogEl\)\s*settingsDialogEl\.close\(\);/);

  // Preserves toolbar icons without destructive textContent overwrites
  assert.match(renderer, /autoBtn\.setAttribute\('aria-pressed'/);
  assert.match(renderer, /followBtn\.setAttribute\('aria-pressed'/);
  assert.match(renderer, /editBtn\.setAttribute\('aria-pressed'/);
  assert.doesNotMatch(renderer, /el\('autoClose'\)\.textContent\s*=\s*'Match pairs:/);
});

test('Monokai, Overleaf, and Overleaf Dark themes are fully supported across stack', () => {
  const appMenu = fs.readFileSync(path.join(__dirname, '../src/app-menu.ts'), 'utf8');
  const main = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
  const renderer = fs.readFileSync(path.join(__dirname, '../src/renderer.ts'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../media/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../media/app.css'), 'utf8');

  // App menu
  assert.match(appMenu, /'monokai'/);
  assert.match(appMenu, /'overleaf'/);
  assert.match(appMenu, /'overleaf-dark'/);
  assert.match(appMenu, /Monokai \(Vibrant Dark\)/);
  assert.match(appMenu, /Overleaf \(Classic Light\)/);

  // Main state & validation
  assert.match(main, /'monokai'\|'overleaf'\|'overleaf-dark'/);
  assert.match(main, /\['auto','dark','midnight','nord','monokai','overleaf','overleaf-dark','light','warm'\]/);

  // Renderer themes
  assert.match(renderer, /monokaiEditorTheme/);
  assert.match(renderer, /monokaiSyntaxHighlighting/);
  assert.match(renderer, /overleafEditorTheme/);
  assert.match(renderer, /overleafSyntaxHighlighting/);
  assert.match(renderer, /overleafDarkEditorTheme/);
  assert.match(renderer, /overleafDarkSyntaxHighlighting/);

  // HTML select options
  assert.match(html, /<option value="monokai">Monokai/);
  assert.match(html, /<option value="overleaf">Overleaf/);
  assert.match(html, /<option value="overleaf-dark">Overleaf Dark/);

  // CSS variables
  assert.match(css, /\[data-theme="monokai"\]/);
  assert.match(css, /\[data-theme="overleaf"\]/);
  assert.match(css, /\[data-theme="overleaf-dark"\]/);
});

test('Overleaf-style error and warning diagnostic badges are wired next to PDF', () => {
  const html = fs.readFileSync(path.join(__dirname, '../media/index.html'), 'utf8');
  const renderer = fs.readFileSync(path.join(__dirname, '../src/renderer.ts'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../media/app.css'), 'utf8');

  // HTML badges
  assert.match(html, /id="pdfDiagnosticsGroup"/);
  assert.match(html, /id="pdfErrorBadge"/);
  assert.match(html, /id="pdfWarningBadge"/);
  assert.match(html, /id="pdfSuccessBadge"/);

  // Renderer logic
  assert.match(renderer, /pdfErrBtn\.onclick/);
  assert.match(renderer, /pdfWarnBtn\.onclick/);
  assert.match(renderer, /pdfSuccBtn\.onclick/);

  // CSS styles
  assert.match(css, /\.pdf-diagnostics-group/);
  assert.match(css, /\.pdf-badge-error/);
  assert.match(css, /\.pdf-badge-warning/);
  assert.match(css, /\.pdf-badge-success/);
});

test('Long document compilation is optimized with recorder, maxrepeat, and scaled debounce', () => {
  const core = fs.readFileSync(path.join(__dirname, '../src/core.ts'), 'utf8');
  const main = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');

  // Core adds -recorder and bounded repeatLimit
  assert.match(core, /'-recorder'/);
  assert.match(core, /`-maxrepeat=\$\{repeatLimit\}`/);
  assert.match(core, /repeatLimit\s*=\s*options\.automatic\s*\?\s*'2'\s*:\s*'5'/);

  // Main debounces based on document length
  assert.match(main, /docLength\s*=\s*text\.length/);
  assert.match(main, /debounceMs\s*=\s*docLength\s*>\s*30000\s*\?\s*700/);
});
