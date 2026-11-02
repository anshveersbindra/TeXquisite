const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Icons and LaTeX completions verification', async () => {
  // 1. Verify icons.js exists and exports clean SVG rendering
  const iconsPath = path.resolve(__dirname, '../dist/icons.js');
  assert.ok(fs.existsSync(iconsPath), 'icons.js should be built');
  const icons = require(iconsPath);
  assert.equal(typeof icons.renderSvg, 'function');
  assert.equal(typeof icons.fileTypeIcon, 'function');

  // Verify SVG generation produces proper SVG tags and stroke="currentColor"
  const folderSvg = icons.renderSvg('folder');
  assert.ok(folderSvg.includes('<svg'), 'Should render <svg> tag');
  assert.ok(folderSvg.includes('stroke="currentColor"'), 'Should use currentColor for adaptive contrast');
  assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(folderSvg), 'Must not contain any emojis');

  // Verify fileTypeIcon mappings
  assert.equal(icons.fileTypeIcon('paper.tex', false), 'fileTex');
  assert.equal(icons.fileTypeIcon('refs.bib', false), 'fileBib');
  assert.equal(icons.fileTypeIcon('custom.cls', false), 'fileGear');
  assert.equal(icons.fileTypeIcon('figure.png', false), 'fileImage');
  assert.equal(icons.fileTypeIcon('notes.md', false), 'fileText');
  assert.equal(icons.fileTypeIcon('subfolder', true), 'folder');

  // 2. Verify latex-completions.js exists and exports createLatexCompletionSource
  const latexPath = path.resolve(__dirname, '../dist/latex-completions.js');
  assert.ok(fs.existsSync(latexPath), 'latex-completions.js should be built');
  const latex = require(latexPath);
  assert.equal(typeof latex.createLatexCompletionSource, 'function');

  const source = latex.createLatexCompletionSource(
    () => [{ key: 'knuth1984', type: 'book', title: 'The TeXbook', author: 'Donald E. Knuth', year: '1984', file: 'refs.bib' }],
    () => [{ label: 'sec:intro', file: 'main.tex', line: 12 }]
  );

  function createMockDoc(text) {
    return {
      lineAt: () => ({ from: 0, text }),
      sliceString: (from, to) => text.slice(from, to),
      length: text.length
    };
  }

  // Mock CompletionContext for \cite{
  const citeCtx = { pos: 6, state: { doc: createMockDoc('\\cite{') } };
  const citeResult = source(citeCtx);
  assert.ok(citeResult, 'Should match cite completion');
  assert.ok(citeResult.options.some(o => o.label === 'knuth1984'), 'Should include knuth1984');

  // Mock CompletionContext for \ref{
  const refCtx = { pos: 5, state: { doc: createMockDoc('\\ref{') } };
  const refResult = source(refCtx);
  assert.ok(refResult, 'Should match ref completion');
  assert.ok(refResult.options.some(o => o.label === 'sec:intro'), 'Should include sec:intro');

  // Mock CompletionContext for \begin{
  const beginCtx = { pos: 7, state: { doc: createMockDoc('\\begin{') } };
  const beginResult = source(beginCtx);
  assert.ok(beginResult, 'Should match begin completion');
  const eqOpt = beginResult.options.find(o => o.label === 'equation');
  assert.ok(eqOpt, 'Should include equation');
  assert.ok(typeof eqOpt.apply === 'function', 'Should have snippet apply function for auto-close');
  assert.ok(beginResult.options.some(o => o.label === 'align'), 'Should include align');
  assert.ok(beginResult.options.some(o => o.label === 'figure'), 'Should include figure');

  // Mock CompletionContext for direct environment \equ
  const envCmdCtx = { pos: 4, state: { doc: createMockDoc('\\equ') } };
  const envCmdResult = source(envCmdCtx);
  assert.ok(envCmdResult.options.some(o => o.label === '\\equation'), 'Should include direct \\equation environment completion');

  // Mock CompletionContext for \sec
  const cmdCtx = { pos: 4, state: { doc: createMockDoc('\\sec') } };
  const cmdResult = source(cmdCtx);
  assert.ok(cmdResult, 'Should match command completion');
  assert.ok(cmdResult.options.some(o => o.label === '\\section'), 'Should include \\section');

  // Mock CompletionContext for BibTeX @ entries
  const bibEntryCtx = { pos: 4, state: { doc: createMockDoc('@art') } };
  const bibEntryResult = source(bibEntryCtx);
  assert.ok(bibEntryResult, 'Should match BibTeX entry completion');
  assert.ok(bibEntryResult.options.some(o => o.label === '@article'), 'Should include @article');
  assert.ok(bibEntryResult.options.some(o => o.label === '@book'), 'Should include @book');

  // Mock CompletionContext for BibTeX fields in .bib file
  const bibFileSource = latex.createLatexCompletionSource(() => [], () => [], () => 'references.bib');
  const bibFieldCtx = { pos: 5, state: { doc: createMockDoc('  aut') } };
  const bibFieldResult = bibFileSource(bibFieldCtx);
  assert.ok(bibFieldResult, 'Should match BibTeX field completion in .bib file');
  assert.ok(bibFieldResult.options.some(o => o.label === 'author'), 'Should include author field');
  assert.ok(bibFieldResult.options.some(o => o.label === 'title'), 'Should include title field');

  // 3. Verify continuous scroll default in HTML and main.js
  const htmlContent = fs.readFileSync(path.resolve(__dirname, '../media/index.html'), 'utf-8');
  assert.ok(htmlContent.includes('<option value="continuous" selected>Continuous scroll</option>'), 'HTML should default to continuous scroll');

  const mainBundle = fs.readFileSync(path.resolve(__dirname, '../dist/main.js'), 'utf-8');
  assert.ok(mainBundle.includes('continuousPreview: true') || mainBundle.includes('continuousPreview:!0'), 'main.js should initialize continuousPreview to true');

  // 4. Verify renderer.js includes mouse wheel listener for zoom and scroll tracking
  const rendererBundle = fs.readFileSync(path.resolve(__dirname, '../media/renderer.js'), 'utf-8');
  assert.ok(rendererBundle.includes('wheel') && rendererBundle.includes('mouseZoomTimer'), 'renderer.js should contain mouse/trackpad wheel zoom handler');
  assert.ok(rendererBundle.includes('continuousView.visiblePage'), 'renderer.js should update page label from continuousView.visiblePage on scroll');

  // 5. Verify comma-separated \usepackage{...} autocompletion
  const pkgCommaCtx = { pos: 20, state: { doc: createMockDoc('\\usepackage{amsmath, ') } };
  const pkgCommaResult = source(pkgCommaCtx);
  assert.ok(pkgCommaResult, 'Should match package completion after comma');
  assert.ok(!pkgCommaResult.options.some(o => o.label === 'amsmath'), 'Should not suggest already-included amsmath');
  assert.ok(pkgCommaResult.options.some(o => o.label === 'geometry'), 'Should suggest geometry after comma');
  assert.ok(pkgCommaResult.options.some(o => o.label === 'graphicx'), 'Should suggest graphicx after comma');

  // 6. Verify comma-separated \cite{...} autocompletion
  const multiBibSource = latex.createLatexCompletionSource(
    () => [
      { key: 'knuth1984', type: 'book', title: 'The TeXbook', author: 'Donald E. Knuth', year: '1984', file: 'refs.bib' },
      { key: 'lamport1994', type: 'book', title: 'LaTeX', author: 'Leslie Lamport', year: '1994', file: 'refs.bib' }
    ],
    () => []
  );
  const citeCommaCtx = { pos: 18, state: { doc: createMockDoc('\\cite{knuth1984, ') } };
  const citeCommaResult = multiBibSource(citeCommaCtx);
  assert.ok(citeCommaResult, 'Should match cite completion after comma');
  assert.ok(!citeCommaResult.options.some(o => o.label === 'knuth1984'), 'Should not suggest already cited knuth1984');
  assert.ok(citeCommaResult.options.some(o => o.label === 'lamport1994'), 'Should suggest lamport1994 after comma');

  // 7. Verify \bibliography{...} autocompletion
  const biblioCtx = { pos: 14, state: { doc: createMockDoc('\\bibliography{') } };
  const biblioResult = multiBibSource(biblioCtx);
  assert.ok(biblioResult, 'Should match bibliography database completion');
  assert.ok(biblioResult.options.some(o => o.label === 'refs'), 'Should suggest refs from refs.bib');

  // 8. Verify new .tex file template in main.js
  assert.ok(mainBundle.includes('\\documentclass[12pt]{article}'), 'main.js should include standard 12pt starter template');
  assert.ok(mainBundle.includes('\\geometry{a4paper, margin=1in}'), 'main.js template should include 1in margin');
  assert.ok(mainBundle.includes('\\title{${baseName}}') || mainBundle.includes('\\title{'), 'main.js template should include dynamic title');

  // 9. Verify math shortcuts in app-menu.ts do not clash
  const appMenuSource = fs.readFileSync(path.resolve(__dirname, '../src/app-menu.ts'), 'utf-8');
  assert.ok(appMenuSource.includes('Alt+F'), 'app-menu.ts should use Alt+F for fraction');
  assert.ok(appMenuSource.includes('Alt+R'), 'app-menu.ts should use Alt+R for square root');
  assert.ok(appMenuSource.includes('Alt+M'), 'app-menu.ts should use Alt+M for inline math');
  assert.ok(appMenuSource.includes('Alt+D'), 'app-menu.ts should use Alt+D for display math');
  assert.ok(!appMenuSource.includes("action('Insert fraction', 'math-frac', 'CmdOrCtrl+/')"), 'No clash with Cmd+/');
  assert.ok(!appMenuSource.includes("action('Insert square root', 'math-sqrt', 'CmdOrCtrl+R')"), 'No clash with Cmd+R');
});


