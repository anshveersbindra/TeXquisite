const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Document outline strictly captures headings (section, subsection, paragraph) and ignores environments', async () => {
  const outlineMod = require(path.resolve(__dirname, '../dist/document-outline.js'));
  assert.equal(typeof outlineMod.documentOutline, 'function');

  const tex = `\\documentclass{article}
\\begin{document}
\\section{Introduction}
Some text here with an equation.
\\begin{equation}
E = mc^2
\\end{equation}
\\subsection{Background}
\\begin{itemize}
\\item Point 1
\\end{itemize}
\\subsubsection{Details}
\\paragraph{Note}
This is a paragraph.
\\subparagraph{Subnote}
This is a subparagraph.
\\end{document}`;

  const items = outlineMod.documentOutline(tex);
  // Must only contain the 5 headings
  assert.equal(items.length, 5);
  assert.equal(items[0].label, 'Introduction');
  assert.equal(items[0].level, 2); // section
  assert.equal(items[1].label, 'Background');
  assert.equal(items[1].level, 3); // subsection
  assert.equal(items[2].label, 'Details');
  assert.equal(items[2].level, 4); // subsubsection
  assert.equal(items[3].label, 'Note');
  assert.equal(items[3].level, 5); // paragraph
  assert.equal(items[4].label, 'Subnote');
  assert.equal(items[4].level, 6); // subparagraph

  // Confirm NO environments like equation, itemize, or document are included
  assert.ok(!items.some(i => i.label === 'equation'));
  assert.ok(!items.some(i => i.label === 'itemize'));
  assert.ok(!items.some(i => i.label === 'document'));
  assert.ok(items.every(i => i.kind === 'section'));
});

test('Toolbar settings icon is an authentic mechanical gear and not a star', () => {
  const toolbarSrc = fs.readFileSync(path.resolve(__dirname, '../src/toolbar.ts'), 'utf8');
  assert.ok(toolbarSrc.includes('settings:'), 'Must define settings path');
  // Mechanical gear path contains 1.65 radius arcs for gear teeth
  assert.ok(toolbarSrc.includes('1.65 1.65'), 'Settings icon must use gear teeth path');
  assert.ok(!toolbarSrc.includes('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v4M12 18v4'), 'Old sun/star path must be removed');
});

test('Dark theme logo is rendered pure white via brightness(0) invert(1)', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../media/app.css'), 'utf8');
  assert.ok(css.includes('[data-theme="dark"] .brand img'), 'Must style brand img in dark theme');
  assert.ok(css.includes('brightness(0) invert(1)'), 'Brand logo in dark theme must use brightness(0) invert(1)');
});

test('Sidebar divider and file upload markup exist', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../media/index.html'), 'utf8');
  assert.ok(html.includes('id="sidebarDivider"'), 'index.html must have #sidebarDivider');
  assert.ok(html.includes('id="uploadProjectFiles"'), 'index.html must have #uploadProjectFiles');
  
  const css = fs.readFileSync(path.resolve(__dirname, '../media/app.css'), 'utf8');
  assert.ok(css.includes('#sidebarDivider'), 'app.css must style #sidebarDivider');
  assert.ok(css.includes('#projectSidebar.drag-over'), 'app.css must style drag-over drop target');
});

test('Project discovery does not generate bbl stub and discovers bib and bcf files', () => {
  const discoverySrc = fs.readFileSync(path.resolve(__dirname, '../src/project-discovery.ts'), 'utf8');
  assert.ok(!discoverySrc.includes("'bbl'"), 'Discovery stub must not create empty bbl file');
  assert.ok(discoverySrc.includes('.bcf'), 'Discovery must inspect bcf file');
  assert.ok(discoverySrc.includes('.bib'), 'Discovery must inspect bib files');
});

test('Renderer defines BibTeX syntax highlighting and Tab autocomplete', () => {
  const rendererSrc = fs.readFileSync(path.resolve(__dirname, '../src/renderer.ts'), 'utf8');
  assert.ok(rendererSrc.includes('bibtexLanguage'), 'Must define bibtexLanguage');
  assert.ok(rendererSrc.includes("key: 'Tab', run: acceptCompletion"), 'Must bind Tab to acceptCompletion');
  assert.ok(rendererSrc.includes("key: 'Mod-h'"), 'Must bind Mod-h to find and replace');
  assert.ok(rendererSrc.includes('initSidebarResizer()'), 'Must initialize sidebar resizer');
});
