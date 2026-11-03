const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Test compiled module from dist
const { parseTeXBreakdown, formatBreakdownText, computeWordCount } = require('../dist/texcount.js');

test('parseTeXBreakdown extracts sections, citations, abstract, captions, and footnotes accurately', () => {
  const sample = `
\\documentclass{article}
\\title{Machine Learning with Neural Networks}
\\author{Anshveer Bindra}
\\date{November 2026}
\\begin{document}
\\maketitle
\\begin{abstract}
This paper presents a novel approach to deep neural architectures. We demonstrate state-of-the-art results on several benchmark datasets.
\\end{abstract}
\\section{Introduction}
Deep learning has achieved immense progress in computer vision and natural language processing \\cite{vaswani2017, lecum1998}. In this work, we extend these findings.
\\subsection{Related Work}
Previous studies examined transformer models extensively \\cite{devlin2018}. However, efficiency remains a key bottleneck.
\\begin{figure}
\\centering
\\caption{Comparison of parameter efficiency across different model sizes.}
\\end{figure}
Our experimental results indicate substantial speedup \\footnote{Measured on NVIDIA A100 GPU cluster.}.
\\end{document}
`;

  const breakdown = parseTeXBreakdown(sample);

  assert.ok(breakdown.total.words > 40, `Expected >40 total words, got ${breakdown.total.words}`);
  assert.ok(breakdown.total.characters > 200, `Expected >200 total characters, got ${breakdown.total.characters}`);

  // Headers: "Introduction" (1) + "Related Work" (2) = 3 words
  assert.equal(breakdown.headers.words, 3);

  // Abstract: 17 words
  assert.ok(breakdown.abstract.words >= 15 && breakdown.abstract.words <= 20, `Abstract words: ${breakdown.abstract.words}`);

  // Captions: "Comparison of parameter efficiency across different model sizes." = 8 words
  assert.equal(breakdown.captions.words, 8);

  // Footnotes: "Measured on NVIDIA A100 GPU cluster." = 6 words
  assert.equal(breakdown.footnotes.words, 6);

  // Main text without in-text citations should have fewer words than main text with citations
  assert.ok(
    breakdown.mainTextWithoutCitations.words < breakdown.mainText.words,
    `Without citations (${breakdown.mainTextWithoutCitations.words}) should be less than with citations (${breakdown.mainText.words})`
  );

  const formatted = formatBreakdownText(breakdown);
  assert.match(formatted, /Total words:\t/);
  assert.match(formatted, /Main text:/);
  assert.match(formatted, /Main text without in-text citations:/);
  assert.match(formatted, /Headers:/);
  assert.match(formatted, /Abstract:/);
  assert.match(formatted, /Captions:/);
  assert.match(formatted, /Footnotes:/);
  assert.match(formatted, /Other:/);
});

test('parseTeXBreakdown does not swallow text when encountering LaTeX line breaks with spacing like \\\\[0.8em]', () => {
  const sample = `
\\documentclass{article}
\\begin{document}
First paragraph with some words.\\\\[0.8em]
{\\small Second paragraph with more words that must not be deleted}\\\\[1.2em]
Third paragraph here.
\\[
  E = mc^2
\\]
Fourth paragraph after math formula.
\\end{document}
`;

  const breakdown = parseTeXBreakdown(sample);
  // There should be ~23 words across all paragraphs, not truncated to 0 or 5 words!
  assert.ok(breakdown.total.words >= 20, `Expected at least 20 words, got ${breakdown.total.words}`);
  assert.ok(breakdown.mainText.characters > 100, `Expected >100 characters, got ${breakdown.mainText.characters}`);
});

test('computeWordCount runs successfully and returns authoritative breakdown', async () => {
  const sample = `
\\documentclass{article}
\\begin{document}
\\section{Test Section}
Here is a complete paragraph with eight distinct words.
\\end{document}
`;

  const result = await computeWordCount(sample);
  assert.ok(result.total.words >= 9, `Expected >= 9 total words, got ${result.total.words}`);
  assert.equal(result.headers.words, 2);
  assert.ok(['texcount', 'internal'].includes(result.source));
});

