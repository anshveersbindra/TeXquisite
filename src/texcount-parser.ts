export interface TeXCountItem {
  words: number;
  characters: number;
}

export interface TeXCountBreakdown {
  total: TeXCountItem;
  mainText: TeXCountItem;
  mainTextWithoutCitations: TeXCountItem;
  headers: TeXCountItem;
  abstract: TeXCountItem;
  captions: TeXCountItem;
  footnotes: TeXCountItem;
  other: TeXCountItem;
  source: 'texcount' | 'internal';
}

/**
 * Remove LaTeX comments (% not escaped by backslash).
 */
export function stripComments(text: string): string {
  return text.replace(/(^|[^\\])%.*$/gm, '$1');
}

/**
 * Count Unicode words and non-whitespace characters in a string.
 */
export function countWordsAndChars(text: string): TeXCountItem {
  if (!text || !text.trim()) {
    return { words: 0, characters: 0 };
  }
  // Match words: alphanumeric sequences, allowing intra-word apostrophes and hyphens
  const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  // Count non-whitespace characters
  const chars = text.match(/\S/gu) || [];
  return {
    words: words.length,
    characters: chars.length,
  };
}

/**
 * Strip LaTeX formatting macros like \textbf{...}, \emph{...}, etc.,
 * leaving their inner contents. Also removes control commands like \label{...}, \ref{...}, etc.
 */
export function cleanLatexMarkup(raw: string): string {
  let s = raw;

  // Remove math blocks
  s = s.replace(/\$\$[\s\S]*?\$\$/g, ' ');
  s = s.replace(/\\\[[\s\S]*?\\\]/g, ' ');
  s = s.replace(/\\begin\{(?:equation|align|gather|multline|displaymath)\*?\}[\s\S]*?\\end\{(?:equation|align|gather|multline|displaymath)\*?\}/g, ' ');
  s = s.replace(/\$[^$\n]+\$/g, ' ');
  s = s.replace(/\\\([^)\n]+\\\)/g, ' ');

  // Remove graphics, labels, references, layout commands
  s = s.replace(/\\includegraphics(?:\s*\[[^\]]*\])?\s*\{[^}]*\}/g, ' ');
  s = s.replace(/\\(?:label|ref|pageref|eqref|citeyear|nocite|bibliography|bibliographystyle)\s*\{[^}]*\}/g, ' ');
  s = s.replace(/\\(?:vspace|hspace|vskip|hskip|rule)(?:\*|\s*\[[^\]]*\])?\s*\{[^}]*\}/g, ' ');
  s = s.replace(/\\(?:centering|raggedright|raggedleft|noindent|clearpage|newpage|bigskip|medskip|smallskip|par)\b/g, ' ');
  s = s.replace(/\\\\(?:\s*\[[^\]]*\])?/g, ' ');

  // Unwrap formatting tags iteratively (e.g. \textbf{\emph{word}})
  for (let i = 0; i < 4; i++) {
    const prev = s;
    s = s.replace(/\\(?:textbf|textit|textsl|textsc|texttt|textsf|textrm|emph|underline|textnormal|text|mbox)\s*\{([^{}]*)\}/g, '$1');
    s = s.replace(/\\(?:href\s*\{[^}]*\}|url)\s*\{([^{}]*)\}/g, '$1');
    if (s === prev) break;
  }

  // Strip remaining commands with arguments
  s = s.replace(/\\[a-zA-Z]+(?:\s*\[[^\]]*\])?\s*\{([^{}]*)\}/g, '$1');
  // Strip command names without arguments
  s = s.replace(/\\[a-zA-Z]+/g, ' ');
  // Replace non-breaking space and braces
  s = s.replace(/[~{}]/g, ' ');

  return s;
}

/**
 * Pure TypeScript LaTeX word and character count analyzer.
 */
export function parseTeXBreakdown(rawText: string): TeXCountBreakdown {
  const code = stripComments(rawText);

  let preamble = '';
  let body = code;

  const docBeginIdx = code.indexOf('\\begin{document}');
  if (docBeginIdx !== -1) {
    preamble = code.slice(0, docBeginIdx);
    const afterBegin = code.slice(docBeginIdx + '\\begin{document}'.length);
    const docEndIdx = afterBegin.indexOf('\\end{document}');
    body = docEndIdx !== -1 ? afterBegin.slice(0, docEndIdx) : afterBegin;
  }

  // 1. Other (title, author, date, thanks from preamble or body)
  const otherParts: string[] = [];
  const metaRegex = /\\(?:title|author|date|thanks)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(preamble + '\n' + body)) !== null) {
    otherParts.push(metaMatch[1]);
  }

  // 2. Abstract
  const abstractParts: string[] = [];
  body = body.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_m, content) => {
    abstractParts.push(content);
    return ' ';
  });

  // 3. Headers (part, chapter, section, subsection, subsubsection, paragraph, subparagraph)
  const headerParts: string[] = [];
  const headerRegex = /\\(?:part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?\s*(?:\[[^\]]*\]\s*)?\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  body = body.replace(headerRegex, (_m, headingText) => {
    headerParts.push(headingText);
    return ' ';
  });

  // 4. Captions
  const captionParts: string[] = [];
  const captionRegex = /\\(?:caption\*?|captionof\*?\{[^}]*\})\s*(?:\[[^\]]*\]\s*)?\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  body = body.replace(captionRegex, (_m, capText) => {
    captionParts.push(capText);
    return ' ';
  });

  // 5. Footnotes
  const footnoteParts: string[] = [];
  const footnoteRegex = /\\(?:footnote|footnotetext)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  body = body.replace(footnoteRegex, (_m, fnText) => {
    footnoteParts.push(fnText);
    return ' ';
  });

  // 6. Citations
  // In main text, citations look like \cite{...}, \citep{...}, \citet{...}, \autocite{...}
  const citeRegex = /\\(?:cite|citep|citet|citeauthor|citeyear|parencite|textcite|autocite|footcite|supercite|cites)\*?(?:\s*\[[^\]]*\])*\s*\{([^}]+)\}/g;

  // Main text WITHOUT in-text citations:
  const bodyWithoutCites = body.replace(citeRegex, ' ');

  // Main text WITH in-text citations:
  // Convert \cite{key1, key2} to readable citation token count so words inside citations are counted
  const bodyWithCites = body.replace(citeRegex, (_m, keys) => {
    const count = keys.split(',').filter((k: string) => k.trim().length > 0).length;
    return ' ' + 'citation '.repeat(Math.max(1, count));
  });

  const cleanedMain = cleanLatexMarkup(bodyWithCites);
  const cleanedMainWithoutCites = cleanLatexMarkup(bodyWithoutCites);
  const cleanedHeaders = cleanLatexMarkup(headerParts.join(' '));
  const cleanedAbstract = cleanLatexMarkup(abstractParts.join(' '));
  const cleanedCaptions = cleanLatexMarkup(captionParts.join(' '));
  const cleanedFootnotes = cleanLatexMarkup(footnoteParts.join(' '));
  const cleanedOther = cleanLatexMarkup(otherParts.join(' '));

  const mainStats = countWordsAndChars(cleanedMain);
  const mainWithoutCitesStats = countWordsAndChars(cleanedMainWithoutCites);
  const headersStats = countWordsAndChars(cleanedHeaders);
  const abstractStats = countWordsAndChars(cleanedAbstract);
  const captionsStats = countWordsAndChars(cleanedCaptions);
  const footnotesStats = countWordsAndChars(cleanedFootnotes);
  const otherStats = countWordsAndChars(cleanedOther);

  const totalWords = mainStats.words + headersStats.words + abstractStats.words + captionsStats.words + footnotesStats.words + otherStats.words;
  const totalCharacters = mainStats.characters + headersStats.characters + abstractStats.characters + captionsStats.characters + footnotesStats.characters + otherStats.characters;

  return {
    total: { words: totalWords, characters: totalCharacters },
    mainText: mainStats,
    mainTextWithoutCitations: mainWithoutCitesStats,
    headers: headersStats,
    abstract: abstractStats,
    captions: captionsStats,
    footnotes: footnotesStats,
    other: otherStats,
    source: 'internal',
  };
}

/**
 * Format breakdown into exact plain-text representation matching user's specification.
 */
export function formatBreakdownText(breakdown: TeXCountBreakdown): string {
  const fmt = (n: number) => n.toLocaleString();
  return [
    `Total words:\t${fmt(breakdown.total.words)}\tCharacters: ${fmt(breakdown.total.characters)}`,
    `Main text:`,
    `${fmt(breakdown.mainText.words)}\t${fmt(breakdown.mainText.characters)}`,
    `Main text without in-text citations:`,
    `${fmt(breakdown.mainTextWithoutCitations.words)}\t${fmt(breakdown.mainTextWithoutCitations.characters)}`,
    `Headers:`,
    `${fmt(breakdown.headers.words)}\t${fmt(breakdown.headers.characters)}`,
    `Abstract:`,
    `${fmt(breakdown.abstract.words)}\t${fmt(breakdown.abstract.characters)}`,
    `Captions:`,
    `${fmt(breakdown.captions.words)}\t${fmt(breakdown.captions.characters)}`,
    `Footnotes:`,
    `${fmt(breakdown.footnotes.words)}\t${fmt(breakdown.footnotes.characters)}`,
    `Other:`,
    `${fmt(breakdown.other.words)}\t${fmt(breakdown.other.characters)}`,
  ].join('\n');
}
