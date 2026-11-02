const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Find & replace dialog modal dismiss styling and markup', () => {
  const css = fs.readFileSync(path.join(__dirname, '../media/app.css'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../media/index.html'), 'utf8');
  const ts = fs.readFileSync(path.join(__dirname, '../src/project-search-ui.ts'), 'utf8');

  // Verify CSS ensures non-open dialogs are completely hidden even with ID selector
  assert.match(css, /#projectSearchDialog:not\(\[open\]\)[\s\S]*?display:\s*none\s*!important/);
  assert.match(css, /#projectSearchDialog\[open\][\s\S]*?display:\s*flex\s*!important/);

  // Verify HTML has the close button in the header
  assert.match(html, /id="closeProjectSearchHeader"/);
  assert.match(html, /id="closeProjectSearch"[\s\S]*?>Close<\/button>/);

  // Verify project-search-ui wires backdrop click and escape key
  assert.match(ts, /e\.target===this\.dialog/);
  assert.match(ts, /e\.key==='Escape'/);
  assert.match(ts, /closeProjectSearchHeader/);
});

test('Core provides localBasis and passes generated bbl/aux to resident context', () => {
  const core = fs.readFileSync(path.join(__dirname, '../src/core.ts'), 'utf8');

  // Verify nativeAttempted copies .bbl, .aux, etc. to input and project.resources
  assert.match(core, /auxExts=\/\\\.\(bbl\|aux\|toc\|out\|lot\|lof\|nav\|snm\|vrb\)\$\/i/);
  assert.match(core, /updatedResources\[idx\]=\[f,new Uint8Array\(content\)\]/);
  assert.match(core, /this\.residentContext\.resources=updatedResources/);

  // Verify localBasis condition includes Native compilation with pdf
  assert.match(core, /backend==='Native compilation\.'&&pdf/);
});

test('Idle verification does not steal interactive compiler without independent owner', () => {
  const main = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
  assert.match(main, /if\(!controller\?\.independentLocalOwner\)\s*\{\s*if\(!required\)return;/);
});

test('SyncTeX forward navigation sorts blocks and interpolates to word level', () => {
  const nav = fs.readFileSync(path.join(__dirname, '../src/native-navigation.ts'), 'utf8');
  assert.match(nav, /parsed\.sort\(\(a,b\)=>a\.page!==b\.page\?a\.page-b\.page:a\.v!==b\.v\?a\.v-b\.v:a\.h-b\.h\)/);
  assert.match(nav, /wordX=sel\.h\+lineRatio\*Math\.max\(0,sel\.width-30\)/);
  assert.match(nav, /wordY=sel\.v-sel\.height/);
});

test('CodeMirror selection and find-replace match styling is defined', () => {
  const css = fs.readFileSync(path.join(__dirname, '../media/app.css'), 'utf8');
  assert.match(css, /\.cm-selectionBackground/);
  assert.match(css, /\.cm-searchMatch/);
  assert.match(css, /\.cm-searchMatch\.cm-searchMatch-selected/);
});

test('PDF worker passes actual original geometry to live tiles', () => {
  const worker = fs.readFileSync(path.join(__dirname, '../src/pdf-worker.ts'), 'utf8');
  assert.match(worker, /originalWidth:actual\.originalWidth,originalHeight:actual\.originalHeight/);
});

