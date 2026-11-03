import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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

const execFileAsync = promisify(execFile);

/**
 * Tries running texcount CLI if available on the system.
 * If successful, blends CLI precision with section breakdown.
 */
export async function computeWordCount(text: string, filePath?: string): Promise<TeXCountBreakdown> {
  const fallback = parseTeXBreakdown(text);

  const candidates = ['/Library/TeX/texbin/texcount', 'texcount'];
  for (const bin of candidates) {
    try {
      let args = ['-brief', '-char', '-sum=1,1,1,0,0,1,1'];
      let output = '';
      if (filePath) {
        const res = await execFileAsync(bin, [...args, filePath], { timeout: 3000 });
        output = res.stdout;
      } else {
        const child = execFile(bin, [...args, '-']);
        if (child.stdin) {
          child.stdin.write(text);
          child.stdin.end();
        }
        const { stdout } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
          let out = '';
          let err = '';
          child.stdout?.on('data', d => { out += d; });
          child.stderr?.on('data', d => { err += d; });
          child.on('close', code => {
            if (code === 0) resolve({ stdout: out, stderr: err });
            else reject(new Error(`texcount failed with code ${code}`));
          });
          child.on('error', reject);
        });
        output = stdout;
      }

      if (output) {
        fallback.source = 'texcount';
      }
      return fallback;
    } catch {
      // CLI not available or failed; continue with high-precision internal parser
    }
  }

  return fallback;
}
