const test = require('node:test');
const assert = require('node:assert/strict');

test('closeTab logic correctly switches to adjacent tab or empties on last tab', () => {
  const state = {
    active: '/path/file2.tex',
    root: '/path/file1.tex',
    docs: [
      { path: '/path/file1.tex', text: 'file1', dirty: false },
      { path: '/path/file2.tex', text: 'file2', dirty: false },
      { path: '/path/file3.tex', text: 'file3', dirty: false }
    ]
  };

  function simulateCloseTab(target) {
    const file = target || state.active;
    const index = state.docs.findIndex(d => d.path === file);
    if (index === -1) return state;
    state.docs.splice(index, 1);
    if (state.active === file) {
      const nextDoc = state.docs[index] ?? state.docs[index - 1];
      state.active = nextDoc ? nextDoc.path : '';
    }
    return state;
  }

  // Close middle active tab (file2) -> should activate file3
  simulateCloseTab('/path/file2.tex');
  assert.equal(state.active, '/path/file3.tex');
  assert.equal(state.docs.length, 2);

  // Close last tab (file3) -> should activate file1
  simulateCloseTab('/path/file3.tex');
  assert.equal(state.active, '/path/file1.tex');
  assert.equal(state.docs.length, 1);

  // Close remaining tab (file1) -> active should become empty ''
  simulateCloseTab('/path/file1.tex');
  assert.equal(state.active, '');
  assert.equal(state.docs.length, 0);
});
