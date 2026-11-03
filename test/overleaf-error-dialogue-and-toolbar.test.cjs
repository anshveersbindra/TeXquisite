const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Preview pane error dialogue replaces PDF viewport on error and supports Overleaf-style switching', () => {
  const html = fs.readFileSync(path.join(__dirname, '../media/index.html'), 'utf8');
  const renderer = fs.readFileSync(path.join(__dirname, '../src/renderer.ts'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../media/app.css'), 'utf8');

  // HTML structure
  assert.match(html, /id="previewErrorOverlay"/);
  assert.match(html, /id="viewSwitchPdf"/);
  assert.match(html, /id="viewSwitchErrors"/);
  assert.match(html, /id="viewSwitchBadge"/);
  assert.match(html, /id="errorOverlayViewPdfBtn"/);
  assert.match(html, /id="errorOverlayRawLogBtn"/);
  assert.match(html, /id="pillAllErrors"/);
  assert.match(html, /id="pillOnlyErrors"/);
  assert.match(html, /id="pillOnlyWarnings"/);
  assert.match(html, /id="errorOverlayList"/);

  // Renderer logic
  assert.match(renderer, /function setPreviewView\(tab:\s*'pdf'\s*\|\s*'errors'/);
  assert.match(renderer, /pdfViewport\.hidden\s*=\s*true/);
  assert.match(renderer, /overlay\.hidden\s*=\s*false/);
  assert.match(renderer, /viewSwitchPdf\.onclick/);
  assert.match(renderer, /viewSwitchErrors\.onclick/);
  assert.match(renderer, /overlayViewPdfBtn\.onclick/);
  assert.match(renderer, /overlayRawLogBtn\.onclick/);
  assert.match(renderer, /overleaf-error-card/);
  assert.match(renderer, /apply-suggestion/);

  // CSS rules
  assert.match(css, /\.preview-error-overlay/);
  assert.match(css, /\.overleaf-error-header/);
  assert.match(css, /\.overleaf-action-btn/);
  assert.match(css, /\.filter-pill/);
  assert.match(css, /\.overleaf-error-card/);
  assert.match(css, /\.pdf-toolbar\.in-error-view/);
});

test('Toolbar layout has clear groups, dividers, legible icon buttons, and prominent green Recompile button', () => {
  const html = fs.readFileSync(path.join(__dirname, '../media/index.html'), 'utf8');
  const toolbar = fs.readFileSync(path.join(__dirname, '../src/toolbar.ts'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../media/app.css'), 'utf8');

  // Groups and dividers in HTML
  assert.match(html, /class="toolbar-group"/);
  assert.match(html, /class="toolbar-divider"/);
  assert.match(html, /class="recompile-btn"/);
  assert.match(html, /class="live-btn"/);

  // Toolbar button formatting in toolbar.ts
  assert.match(toolbar, /button\.className\s*=\s*'recompile-btn'/);
  assert.match(toolbar, /button\.className\s*=\s*'live-btn'/);
  assert.match(toolbar, /<span>Recompile<\/span>\s*<kbd>⌘B<\/kbd>/);

  // CSS for recompile and live buttons
  assert.match(css, /\.recompile-btn\s*\{[\s\S]*?background:\s*linear-gradient\(180deg,\s*#10b981/);
  assert.match(css, /\.toolbar-divider\s*\{/);
  assert.match(css, /\.live-btn\s*\{/);
});
