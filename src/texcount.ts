import { execFile } from 'node:child_process';
import path from 'node:path';
import {
  TeXCountItem,
  TeXCountBreakdown,
  parseTeXBreakdown,
  formatBreakdownText,
  countWordsAndChars,
  cleanLatexMarkup,
  stripComments,
} from './texcount-parser';

export {
  TeXCountItem,
  TeXCountBreakdown,
  parseTeXBreakdown,
  formatBreakdownText,
  countWordsAndChars,
  cleanLatexMarkup,
  stripComments,
};

/**
 * Runs texcount CLI with input text over stdin and returns text, header, and caption counts.
 */
function runTexcountCli(bin: string, input: string, cwd?: string): Promise<{ text: number; headers: number; captions: number; inlineMath: number; displayMath: number }> {
  return new Promise((resolve, reject) => {
    const args = ['-template={1}:{2}:{3}:{4}:{5}:{6}:{7}', '-merge', '-inc', '-'];
    const child = execFile(bin, args, { cwd, timeout: 5000 }, (error, stdout) => {
      if (error) return reject(error);
      const parts = stdout.trim().split(':').map(Number);
      resolve({
        text: parts[0] || 0,
        headers: parts[1] || 0,
        captions: parts[2] || 0,
        inlineMath: parts[5] || 0,
        displayMath: parts[6] || 0,
      });
    });
    if (child.stdin) {
      child.stdin.write('%TC:envir titlepage [] text\n' + input);
      child.stdin.end();
    }
  });
}

/**
 * Tries running texcount CLI if available on the system.
 * If successful, blends CLI precision with component breakdown.
 */
export async function computeWordCount(text: string, filePath?: string): Promise<TeXCountBreakdown> {
  const fallback = parseTeXBreakdown(text);
  const cwd = filePath ? path.dirname(filePath) : undefined;

  const candidates = ['/Library/TeX/texbin/texcount', 'texcount'];
  for (const bin of candidates) {
    try {
      const citeRegex = /\\(?:cite|citep|citet|citeauthor|citeyear|parencite|textcite|autocite|footcite|supercite|cites)\*?(?:\s*\[[^\]]*\])*\s*\{([^}]+)\}/g;
      const textWithoutCites = text.replace(citeRegex, ' ');

      const [withCites, withoutCites] = await Promise.all([
        runTexcountCli(bin, text, cwd),
        runTexcountCli(bin, textWithoutCites, cwd),
      ]);

      if (withCites && withCites.text > 0) {
        fallback.mainText.words = withCites.text;
        fallback.headers.words = withCites.headers;
        fallback.captions.words = withCites.captions;
        fallback.mainTextWithoutCitations.words = withoutCites.text;
        if (withCites.inlineMath !== undefined) fallback.inlineMath = withCites.inlineMath;
        if (withCites.displayMath !== undefined) fallback.displayMath = withCites.displayMath;
        fallback.total.words =
          fallback.mainText.words +
          fallback.headers.words +
          fallback.abstract.words +
          fallback.captions.words +
          fallback.footnotes.words +
          fallback.other.words;
        fallback.source = 'texcount';
        return fallback;
      }
    } catch {
      // CLI not available or failed; continue with high-precision internal parser
    }
  }

  return fallback;
}
