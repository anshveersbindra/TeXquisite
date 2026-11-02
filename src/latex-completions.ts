import {Completion, CompletionContext, CompletionResult, snippetCompletion} from '@codemirror/autocomplete';

export interface BibEntry {
  key: string;
  type: string;
  title?: string;
  author?: string;
  year?: string;
  file: string;
}

const COMMON_PACKAGES = [
  'amsmath', 'amssymb', 'amsthm', 'mathtools', 'graphicx', 'hyperref',
  'geometry', 'booktabs', 'xcolor', 'tikz', 'pgfplots', 'microtype',
  'biblatex', 'natbib', 'cleveref', 'listings', 'minted', 'enumitem',
  'caption', 'subcaption', 'float', 'array', 'siunitx', 'algorithm2e',
  'algorithmicx', 'fancyhdr', 'titlesec', 'babel', 'fontspec', 'unicode-math'
];

const DOCUMENT_CLASSES = [
  'article', 'report', 'book', 'beamer', 'letter', 'memoir',
  'standalone', 'scrartcl', 'scrreprt', 'scrbook', 'amsart', 'proc'
];

export const ENVIRONMENTS = [
  { name: 'equation', snippet: '\\begin{equation}\n\t${1}\n\\end{equation}', info: 'Numbered displayed formula' },
  { name: 'equation*', snippet: '\\begin{equation*}\n\t${1}\n\\end{equation*}', info: 'Unnumbered displayed formula' },
  { name: 'align', snippet: '\\begin{align}\n\t${1} &= ${2} \\\\\n\\end{align}', info: 'Multi-line equations aligned at &' },
  { name: 'align*', snippet: '\\begin{align*}\n\t${1} &= ${2} \\\\\n\\end{align*}', info: 'Unnumbered multi-line equations' },
  { name: 'gather', snippet: '\\begin{gather}\n\t${1} \\\\\n\\end{gather}', info: 'Multi-line equations centered' },
  { name: 'gather*', snippet: '\\begin{gather*}\n\t${1} \\\\\n\\end{gather*}', info: 'Unnumbered centered equations' },
  { name: 'multline', snippet: '\\begin{multline}\n\t${1} \\\\\n\\end{multline}', info: 'Single long equation spanning lines' },
  { name: 'figure', snippet: '\\begin{figure}[htbp]\n\t\\centering\n\t\\includegraphics[width=0.8\\linewidth]{${1:image.png}}\n\t\\caption{${2:Caption}}\n\t\\label{fig:${3:label}}\n\\end{figure}', info: 'Floating figure environment' },
  { name: 'figure*', snippet: '\\begin{figure*}[htbp]\n\t\\centering\n\t\\includegraphics[width=\\linewidth]{${1:image.png}}\n\t\\caption{${2:Caption}}\n\t\\label{fig:${3:label}}\n\\end{figure*}', info: 'Two-column floating figure' },
  { name: 'table', snippet: '\\begin{table}[htbp]\n\t\\centering\n\t\\caption{${1:Caption}}\n\t\\label{tab:${2:label}}\n\t\\begin{tabular}{${3:c c c}}\n\t\t\\hline\n\t\t${4:A & B & C} \\\\\n\t\t\\hline\n\t\\end{tabular}\n\\end{table}', info: 'Floating table environment' },
  { name: 'tabular', snippet: '\\begin{tabular}{${1:l c r}}\n\t\\hline\n\t${2:Col 1 & Col 2 & Col 3} \\\\\n\t\\hline\n\\end{tabular}', info: 'Table column layout' },
  { name: 'itemize', snippet: '\\begin{itemize}\n\t\\item ${1}\n\\end{itemize}', info: 'Bulleted list' },
  { name: 'enumerate', snippet: '\\begin{enumerate}\n\t\\item ${1}\n\\end{enumerate}', info: 'Numbered list' },
  { name: 'description', snippet: '\\begin{description}\n\t\\item[${1:Term}] ${2:Description}\n\\end{description}', info: 'Description list' },
  { name: 'matrix', snippet: '\\begin{matrix}\n\t${1} & ${2} \\\\\n\\end{matrix}', info: 'Matrix without brackets' },
  { name: 'pmatrix', snippet: '\\begin{pmatrix}\n\t${1} & ${2} \\\\\n\\end{pmatrix}', info: 'Matrix in parentheses ( )' },
  { name: 'bmatrix', snippet: '\\begin{bmatrix}\n\t${1} & ${2} \\\\\n\\end{bmatrix}', info: 'Matrix in brackets [ ]' },
  { name: 'vmatrix', snippet: '\\begin{vmatrix}\n\t${1} & ${2} \\\\\n\\end{vmatrix}', info: 'Determinant matrix | |' },
  { name: 'cases', snippet: '\\begin{cases}\n\t${1:value} & \\text{if } ${2:condition} \\\\\n\\end{cases}', info: 'Piecewise function cases' },
  { name: 'proof', snippet: '\\begin{proof}\n\t${1}\n\\end{proof}', info: 'Mathematical proof environment' },
  { name: 'theorem', snippet: '\\begin{theorem}\n\t${1}\n\\end{theorem}', info: 'Theorem statement' },
  { name: 'lemma', snippet: '\\begin{lemma}\n\t${1}\n\\end{lemma}', info: 'Lemma statement' },
  { name: 'definition', snippet: '\\begin{definition}\n\t${1}\n\\end{definition}', info: 'Mathematical definition' },
  { name: 'example', snippet: '\\begin{example}\n\t${1}\n\\end{example}', info: 'Example environment' },
  { name: 'remark', snippet: '\\begin{remark}\n\t${1}\n\\end{remark}', info: 'Remark environment' },
  { name: 'abstract', snippet: '\\begin{abstract}\n\t${1}\n\\end{abstract}', info: 'Paper abstract' },
  { name: 'center', snippet: '\\begin{center}\n\t${1}\n\\end{center}', info: 'Centered text block' },
  { name: 'flushleft', snippet: '\\begin{flushleft}\n\t${1}\n\\end{flushleft}', info: 'Left-aligned text' },
  { name: 'flushright', snippet: '\\begin{flushright}\n\t${1}\n\\end{flushright}', info: 'Right-aligned text' },
  { name: 'verbatim', snippet: '\\begin{verbatim}\n${1}\n\\end{verbatim}', info: 'Literal monospace text' },
  { name: 'lstlisting', snippet: '\\begin{lstlisting}[language=${1:Python}]\n${2}\n\\end{lstlisting}', info: 'Syntax-highlighted code block' },
  { name: 'tikzpicture', snippet: '\\begin{tikzpicture}\n\t${1}\n\\end{tikzpicture}', info: 'TikZ vector graphics canvas' },
  { name: 'frame', snippet: '\\begin{frame}{${1:Title}}\n\t${2}\n\\end{frame}', info: 'Beamer presentation slide' }
];

export const BIBTEX_ENTRIES = [
  {
    type: 'article',
    snippet: '@article{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Paper Title}},\n\tjournal = {${4:Journal Name}},\n\tyear = {${5:2026}},\n\tvolume = {${6:1}},\n\tnumber = {${7:1}},\n\tpages = {${8:1--10}}\n}',
    info: 'Journal article reference'
  },
  {
    type: 'book',
    snippet: '@book{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Book Title}},\n\tpublisher = {${4:Publisher Name}},\n\tyear = {${5:2026}}\n}',
    info: 'Whole book with an explicit publisher'
  },
  {
    type: 'inproceedings',
    snippet: '@inproceedings{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Conference Paper Title}},\n\tbooktitle = {${4:Proceedings of Conference}},\n\tyear = {${5:2026}}\n}',
    info: 'Conference proceeding article'
  },
  {
    type: 'misc',
    snippet: '@misc{${1:citation_key},\n\tauthor = {${2:Author or Organization}},\n\ttitle = {${3:Title or Resource}},\n\thowpublished = {${4:\\url{https://}}},\n\tyear = {${5:2026}},\n\tnote = {${6:Accessed: 2026-11-01}}\n}',
    info: 'Miscellaneous resource, website, or preprint'
  },
  {
    type: 'phdthesis',
    snippet: '@phdthesis{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Thesis Title}},\n\tschool = {${4:University Name}},\n\tyear = {${5:2026}}\n}',
    info: 'PhD dissertation'
  },
  {
    type: 'mastersthesis',
    snippet: '@mastersthesis{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Thesis Title}},\n\tschool = {${4:University Name}},\n\tyear = {${5:2026}}\n}',
    info: "Master's thesis"
  },
  {
    type: 'techreport',
    snippet: '@techreport{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Report Title}},\n\tinstitution = {${4:Institution or Organization}},\n\tyear = {${5:2026}}\n}',
    info: 'Technical report published by an institution'
  },
  {
    type: 'online',
    snippet: '@online{${1:citation_key},\n\tauthor = {${2:Author or Organization}},\n\ttitle = {${3:Website or Document Title}},\n\turl = {${4:https://}},\n\turldate = {${5:2026-11-01}}\n}',
    info: 'Online web page or electronic document'
  },
  {
    type: 'software',
    snippet: '@software{${1:citation_key},\n\tauthor = {${2:Author or Project Team}},\n\ttitle = {${3:Software Title}},\n\tversion = {${4:1.0}},\n\turl = {${5:https://}},\n\tyear = {${6:2026}}\n}',
    info: 'Software library or program citation'
  },
  {
    type: 'unpublished',
    snippet: '@unpublished{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Manuscript Title}},\n\tnote = {${4:Unpublished manuscript}},\n\tyear = {${5:2026}}\n}',
    info: 'Document having an author and title, but not formally published'
  },
  {
    type: 'incollection',
    snippet: '@incollection{${1:citation_key},\n\tauthor = {${2:Author Name}},\n\ttitle = {${3:Chapter Title}},\n\tbooktitle = {${4:Book Title}},\n\tpublisher = {${5:Publisher}},\n\tyear = {${6:2026}}\n}',
    info: 'A part of a book having its own title'
  }
];

export const BIBTEX_FIELDS = [
  { name: 'author', template: 'author = {${1}},', info: 'Names of the authors (separated by and)' },
  { name: 'title', template: 'title = {${1}},', info: 'Title of the work' },
  { name: 'journal', template: 'journal = {${1}},', info: 'Journal name' },
  { name: 'year', template: 'year = {${1:2026}},', info: 'Year of publication' },
  { name: 'volume', template: 'volume = {${1}},', info: 'Volume of journal or multi-volume book' },
  { name: 'number', template: 'number = {${1}},', info: 'Issue number of journal' },
  { name: 'pages', template: 'pages = {${1:1--10}},', info: 'Page range' },
  { name: 'month', template: 'month = {${1}},', info: 'Month of publication' },
  { name: 'doi', template: 'doi = {${1}},', info: 'Digital Object Identifier' },
  { name: 'url', template: 'url = {${1}},', info: 'Uniform Resource Locator link' },
  { name: 'urldate', template: 'urldate = {${1:2026-11-01}},', info: 'Date the URL was accessed' },
  { name: 'publisher', template: 'publisher = {${1}},', info: 'Publisher name' },
  { name: 'booktitle', template: 'booktitle = {${1}},', info: 'Title of proceedings or book containing paper' },
  { name: 'editor', template: 'editor = {${1}},', info: 'Names of the editors' },
  { name: 'series', template: 'series = {${1}},', info: 'Series of books the item was published in' },
  { name: 'address', template: 'address = {${1}},', info: 'Publisher city or conference location' },
  { name: 'edition', template: 'edition = {${1}},', info: 'Edition of a book (e.g. 2nd)' },
  { name: 'school', template: 'school = {${1}},', info: 'Degree-granting institution' },
  { name: 'institution', template: 'institution = {${1}},', info: 'Sponsoring institution' },
  { name: 'howpublished', template: 'howpublished = {${1}},', info: 'How something strange was published' },
  { name: 'note', template: 'note = {${1}},', info: 'Any additional notes' },
  { name: 'abstract', template: 'abstract = {${1}},', info: 'Abstract of the article or paper' },
  { name: 'keywords', template: 'keywords = {${1}},', info: 'Key terms or categories' },
  { name: 'isbn', template: 'isbn = {${1}},', info: 'International Standard Book Number' },
  { name: 'issn', template: 'issn = {${1}},', info: 'International Standard Serial Number' }
];

interface CommandTemplate {
  name: string;
  template?: string;
  info: string;
  detail?: string;
  type?: string;
  boost?: number;
}

const COMMAND_TEMPLATES: CommandTemplate[] = [
  // Document Structure
  { name: 'documentclass', template: '\\documentclass[${1:11pt,a4paper}]{${2:article}}', detail: '[opts]{class}', info: 'Document class declaration', boost: 95 },
  { name: 'usepackage', template: '\\usepackage[${1:options}]{${2:package}}', detail: '[opts]{package}', info: 'Import LaTeX package', boost: 94 },
  { name: 'begin', template: '\\begin{${1:equation}}\n\t${2}\n\\end{${1:equation}}', detail: '{env}', info: 'Begin an environment with auto \\end{}', boost: 96 },
  { name: 'end', template: '\\end{${1:equation}}', detail: '{env}', info: 'End an environment', boost: 90 },
  { name: 'section', template: '\\section{${1:Title}}', detail: '{title}', info: 'Numbered major section', boost: 93 },
  { name: 'section*', template: '\\section*{${1:Title}}', detail: '{title}', info: 'Unnumbered major section', boost: 91 },
  { name: 'subsection', template: '\\subsection{${1:Title}}', detail: '{title}', info: 'Numbered subsection', boost: 92 },
  { name: 'subsubsection', template: '\\subsubsection{${1:Title}}', detail: '{title}', info: 'Numbered sub-subsection', boost: 90 },
  { name: 'paragraph', template: '\\paragraph{${1:Title}}', detail: '{title}', info: 'Paragraph heading', boost: 88 },
  { name: 'chapter', template: '\\chapter{${1:Title}}', detail: '{title}', info: 'Chapter heading (books/reports)', boost: 89 },
  { name: 'label', template: '\\label{${1:sec:name}}', detail: '{key}', info: 'Anchor cross-reference label', boost: 94 },
  { name: 'ref', template: '\\ref{${1:key}}', detail: '{key}', info: 'Cross-reference to a label', boost: 94 },
  { name: 'eqref', template: '\\eqref{${1:eq:key}}', detail: '{key}', info: 'Equation reference (1)', boost: 93 },
  { name: 'pageref', template: '\\pageref{${1:key}}', detail: '{key}', info: 'Page reference to label', boost: 89 },
  { name: 'cite', template: '\\cite{${1:key}}', detail: '{key}', info: 'Citation reference', boost: 94 },
  { name: 'citep', template: '\\citep{${1:key}}', detail: '{key}', info: 'Parenthetical citation (Author, Year)', boost: 93 },
  { name: 'citet', template: '\\citet{${1:key}}', detail: '{key}', info: 'Textual citation Author (Year)', boost: 93 },
  { name: 'caption', template: '\\caption{${1:Text}}', detail: '{text}', info: 'Figure or table caption', boost: 88 },
  { name: 'footnote', template: '\\footnote{${1:Text}}', detail: '{text}', info: 'Insert a footnote', boost: 85 },
  { name: 'includegraphics', template: '\\includegraphics[width=${1:0.8\\linewidth}]{${2:file}}', detail: '[opts]{file}', info: 'Embed graphics file', boost: 92 },
  { name: 'input', template: '\\input{${1:file.tex}}', detail: '{file}', info: 'Include source file inline', boost: 86 },
  { name: 'include', template: '\\include{${1:file.tex}}', detail: '{file}', info: 'Include on fresh page', boost: 85 },
  { name: 'bibliography', template: '\\bibliography{${1:references}}', detail: '{file}', info: 'Specify .bib database', boost: 88 },
  { name: 'bibliographystyle', template: '\\bibliographystyle{${1:plain}}', detail: '{style}', info: 'Bibliography style', boost: 87 },
  { name: 'newcommand', template: '\\newcommand{${1:\\cmd}}[${2:args}]{${3:definition}}', detail: '{cmd}[n]{def}', info: 'Define custom command', boost: 84 },
  { name: 'renewcommand', template: '\\renewcommand{${1:\\cmd}}[${2:args}]{${3:definition}}', detail: '{cmd}[n]{def}', info: 'Redefine command', boost: 83 },
  { name: 'url', template: '\\url{${1:https://}}', detail: '{url}', info: 'Typeset clickable URL', boost: 86 },
  { name: 'href', template: '\\href{${1:url}}{${2:text}}', detail: '{url}{text}', info: 'Hyperlink with custom text', boost: 86 },

  // Direct Environment Shortcuts (e.g. typing \equation or \align immediately creates \begin and \end)
  ...ENVIRONMENTS.map(env => ({
    name: env.name.replace('*', 'star'),
    template: env.snippet,
    detail: 'auto \\end{' + env.name + '}',
    info: env.info,
    type: 'class',
    boost: 95
  })),

  // Typography & Text Styles
  { name: 'textbf', template: '\\textbf{${1:text}}', detail: '{text}', info: 'Bold text', boost: 93 },
  { name: 'textit', template: '\\textit{${1:text}}', detail: '{text}', info: 'Italic text', boost: 93 },
  { name: 'emph', template: '\\emph{${1:text}}', detail: '{text}', info: 'Emphasized text', boost: 92 },
  { name: 'underline', template: '\\underline{${1:text}}', detail: '{text}', info: 'Underlined text', boost: 88 },
  { name: 'texttt', template: '\\texttt{${1:code}}', detail: '{text}', info: 'Monospace typewriter font', boost: 90 },
  { name: 'textsc', template: '\\textsc{${1:text}}', detail: '{text}', info: 'Small caps text', boost: 85 },
  { name: 'centering', template: '\\centering', detail: '', info: 'Center alignment in current group', boost: 86 },
  { name: 'noindent', template: '\\noindent', detail: '', info: 'Suppress paragraph indentation', boost: 87 },
  { name: 'newline', template: '\\newline', detail: '', info: 'Break line without new paragraph', boost: 84 },
  { name: 'newpage', template: '\\newpage', detail: '', info: 'Break to new page', boost: 85 },
  { name: 'vspace', template: '\\vspace{${1:1em}}', detail: '{length}', info: 'Vertical space', boost: 84 },
  { name: 'hspace', template: '\\hspace{${1:1em}}', detail: '{length}', info: 'Horizontal space', boost: 84 },
  { name: 'item', template: '\\item ', detail: '', info: 'List item', boost: 94 },

  // Math Commands & Constructs
  { name: 'frac', template: '\\frac{${1:numerator}}{${2:denominator}}', detail: '{num}{den}', info: 'Mathematical fraction', boost: 97 },
  { name: 'sqrt', template: '\\sqrt{${1:x}}', detail: '{x}', info: 'Square root', boost: 95 },
  { name: 'sqrtn', template: '\\sqrt[${1:n}]{${2:x}}', detail: '[n]{x}', info: 'n-th root', boost: 90 },
  { name: 'sum', template: '\\sum_{${1:i=1}}^{${2:n}}', detail: '_{i}^{n}', info: 'Summation operator', boost: 95 },
  { name: 'prod', template: '\\prod_{${1:i=1}}^{${2:n}}', detail: '_{i}^{n}', info: 'Product operator', boost: 93 },
  { name: 'int', template: '\\int_{${1:a}}^{${2:b}}', detail: '_{a}^{b}', info: 'Definite integral', boost: 94 },
  { name: 'iint', template: '\\iint', detail: '', info: 'Double integral', boost: 88 },
  { name: 'iiint', template: '\\iiint', detail: '', info: 'Triple integral', boost: 87 },
  { name: 'oint', template: '\\oint', detail: '', info: 'Contour line integral', boost: 87 },
  { name: 'lim', template: '\\lim_{${1:x \\to \\infty}}', detail: '_{x\\to\\infty}', info: 'Limit operator', boost: 91 },
  { name: 'partial', template: '\\partial', detail: '∂', info: 'Partial derivative symbol', boost: 92 },
  { name: 'nabla', template: '\\nabla', detail: '∇', info: 'Del / gradient operator', boost: 90 },
  { name: 'infty', template: '\\infty', detail: '∞', info: 'Infinity symbol', boost: 93 },
  { name: 'hbar', template: '\\hbar', detail: 'ℏ', info: 'Reduced Planck constant', boost: 85 },
  { name: 'left', template: '\\left( ${1} \\right)', detail: '(...)', info: 'Auto-sizing paired delimiters', boost: 91 },
  { name: 'mathbf', template: '\\mathbf{${1:x}}', detail: '{x}', info: 'Bold math font', boost: 90 },
  { name: 'mathit', template: '\\mathit{${1:x}}', detail: '{x}', info: 'Italic math font', boost: 87 },
  { name: 'mathrm', template: '\\mathrm{${1:d}}', detail: '{x}', info: 'Roman upright math font', boost: 89 },
  { name: 'mathcal', template: '\\mathcal{${1:L}}', detail: '{L}', info: 'Calligraphic math script', boost: 90 },
  { name: 'mathbb', template: '\\mathbb{${1:R}}', detail: '{R}', info: 'Blackboard bold (R, C, N, Z)', boost: 91 },
  { name: 'bm', template: '\\bm{${1:x}}', detail: '{x}', info: 'Bold math symbol (amsmath/bm)', boost: 89 },
  { name: 'text', template: '\\text{${1:word}}', detail: '{text}', info: 'Normal text inside math', boost: 92 },
  { name: 'hat', template: '\\hat{${1:x}}', detail: '{x}', info: 'Hat accent', boost: 88 },
  { name: 'bar', template: '\\bar{${1:x}}', detail: '{x}', info: 'Overbar accent', boost: 88 },
  { name: 'vec', template: '\\vec{${1:x}}', detail: '{x}', info: 'Vector arrow accent', boost: 90 },
  { name: 'tilde', template: '\\tilde{${1:x}}', detail: '{x}', info: 'Tilde accent', boost: 87 },
  { name: 'dot', template: '\\dot{${1:x}}', detail: '{x}', info: 'Single dot (time derivative)', boost: 87 },
  { name: 'ddot', template: '\\ddot{${1:x}}', detail: '{x}', info: 'Double dot (second derivative)', boost: 86 },

  // Greek Alphabet
  { name: 'alpha', template: '\\alpha', detail: 'α', info: 'Greek letter alpha', boost: 92 },
  { name: 'beta', template: '\\beta', detail: 'β', info: 'Greek letter beta', boost: 92 },
  { name: 'gamma', template: '\\gamma', detail: 'γ', info: 'Greek letter gamma', boost: 91 },
  { name: 'delta', template: '\\delta', detail: 'δ', info: 'Greek letter delta', boost: 91 },
  { name: 'epsilon', template: '\\epsilon', detail: 'ϵ', info: 'Greek letter epsilon', boost: 91 },
  { name: 'varepsilon', template: '\\varepsilon', detail: 'ε', info: 'Greek variant epsilon', boost: 90 },
  { name: 'zeta', template: '\\zeta', detail: 'ζ', info: 'Greek letter zeta', boost: 86 },
  { name: 'eta', template: '\\eta', detail: 'η', info: 'Greek letter eta', boost: 87 },
  { name: 'theta', template: '\\theta', detail: 'θ', info: 'Greek letter theta', boost: 92 },
  { name: 'vartheta', template: '\\vartheta', detail: 'ϑ', info: 'Greek variant theta', boost: 88 },
  { name: 'iota', template: '\\iota', detail: 'ι', info: 'Greek letter iota', boost: 85 },
  { name: 'kappa', template: '\\kappa', detail: 'κ', info: 'Greek letter kappa', boost: 87 },
  { name: 'lambda', template: '\\lambda', detail: 'λ', info: 'Greek letter lambda', boost: 92 },
  { name: 'mu', template: '\\mu', detail: 'μ', info: 'Greek letter mu', boost: 91 },
  { name: 'nu', template: '\\nu', detail: 'ν', info: 'Greek letter nu', boost: 87 },
  { name: 'xi', template: '\\xi', detail: 'ξ', info: 'Greek letter xi', boost: 86 },
  { name: 'pi', template: '\\pi', detail: 'π', info: 'Greek letter pi', boost: 94 },
  { name: 'rho', template: '\\rho', detail: 'ρ', info: 'Greek letter rho', boost: 90 },
  { name: 'sigma', template: '\\sigma', detail: 'σ', info: 'Greek letter sigma', boost: 92 },
  { name: 'tau', template: '\\tau', detail: 'τ', info: 'Greek letter tau', boost: 90 },
  { name: 'upsilon', template: '\\upsilon', detail: 'υ', info: 'Greek letter upsilon', boost: 85 },
  { name: 'phi', template: '\\phi', detail: 'ϕ', info: 'Greek letter phi', boost: 92 },
  { name: 'varphi', template: '\\varphi', detail: 'φ', info: 'Greek variant phi', boost: 91 },
  { name: 'chi', template: '\\chi', detail: 'χ', info: 'Greek letter chi', boost: 86 },
  { name: 'psi', template: '\\psi', detail: 'ψ', info: 'Greek letter psi', boost: 89 },
  { name: 'omega', template: '\\omega', detail: 'ω', info: 'Greek letter omega', boost: 92 },

  // Capital Greek
  { name: 'Gamma', template: '\\Gamma', detail: 'Γ', info: 'Capital Gamma', boost: 89 },
  { name: 'Delta', template: '\\Delta', detail: 'Δ', info: 'Capital Delta (Laplacian)', boost: 92 },
  { name: 'Theta', template: '\\Theta', detail: 'Θ', info: 'Capital Theta', boost: 89 },
  { name: 'Lambda', template: '\\Lambda', detail: 'Λ', info: 'Capital Lambda', boost: 90 },
  { name: 'Xi', template: '\\Xi', detail: 'Ξ', info: 'Capital Xi', boost: 86 },
  { name: 'Pi', template: '\\Pi', detail: 'Π', info: 'Capital Pi', boost: 88 },
  { name: 'Sigma', template: '\\Sigma', detail: 'Σ', info: 'Capital Sigma', boost: 91 },
  { name: 'Phi', template: '\\Phi', detail: 'Φ', info: 'Capital Phi', boost: 90 },
  { name: 'Psi', template: '\\Psi', detail: 'Ψ', info: 'Capital Psi', boost: 88 },
  { name: 'Omega', template: '\\Omega', detail: 'Ω', info: 'Capital Omega', boost: 91 },

  // Relations & Logic
  { name: 'leq', template: '\\leq', detail: '≤', info: 'Less than or equal', boost: 91 },
  { name: 'geq', template: '\\geq', detail: '≥', info: 'Greater than or equal', boost: 91 },
  { name: 'neq', template: '\\neq', detail: '≠', info: 'Not equal', boost: 92 },
  { name: 'approx', template: '\\approx', detail: '≈', info: 'Approximately equal', boost: 91 },
  { name: 'equiv', template: '\\equiv', detail: '≡', info: 'Equivalent / identically equal', boost: 89 },
  { name: 'times', template: '\\times', detail: '×', info: 'Multiplication cross', boost: 91 },
  { name: 'cdot', template: '\\cdot', detail: '·', info: 'Centered dot multiplication', boost: 92 },
  { name: 'pm', template: '\\pm', detail: '±', info: 'Plus-minus', boost: 90 },
  { name: 'mp', template: '\\mp', detail: '∓', info: 'Minus-plus', boost: 86 },
  { name: 'to', template: '\\to', detail: '→', info: 'Right arrow / maps to', boost: 93 },
  { name: 'rightarrow', template: '\\rightarrow', detail: '→', info: 'Right arrow', boost: 91 },
  { name: 'leftarrow', template: '\\leftarrow', detail: '←', info: 'Left arrow', boost: 89 },
  { name: 'Rightarrow', template: '\\Rightarrow', detail: '⇒', info: 'Implies', boost: 91 },
  { name: 'Leftarrow', template: '\\Leftarrow', detail: '⇐', info: 'Implied by', boost: 87 },
  { name: 'iff', template: '\\iff', detail: '⟺', info: 'If and only if', boost: 90 },
  { name: 'implies', template: '\\implies', detail: '⟹', info: 'Implies operator', boost: 90 },
  { name: 'in', template: '\\in', detail: '∈', info: 'Element of set', boost: 92 },
  { name: 'notin', template: '\\notin', detail: '∉', info: 'Not an element of set', boost: 89 },
  { name: 'subset', template: '\\subset', detail: '⊂', info: 'Proper subset', boost: 89 },
  { name: 'subseteq', template: '\\subseteq', detail: '⊆', info: 'Subset or equal', boost: 89 },
  { name: 'cap', template: '\\cap', detail: '∩', info: 'Set intersection', boost: 90 },
  { name: 'cup', template: '\\cup', detail: '∪', info: 'Set union', boost: 90 },
  { name: 'forall', template: '\\forall', detail: '∀', info: 'Universal quantifier', boost: 90 },
  { name: 'exists', template: '\\exists', detail: '∃', info: 'Existential quantifier', boost: 90 },
  { name: 'emptyset', template: '\\emptyset', detail: '∅', info: 'Empty set', boost: 88 },

  // Standard Functions
  { name: 'sin', template: '\\sin', detail: 'sin', info: 'Sine function', boost: 89 },
  { name: 'cos', template: '\\cos', detail: 'cos', info: 'Cosine function', boost: 89 },
  { name: 'tan', template: '\\tan', detail: 'tan', info: 'Tangent function', boost: 89 },
  { name: 'sec', template: '\\sec', detail: 'sec', info: 'Secant function', boost: 85 },
  { name: 'csc', template: '\\csc', detail: 'csc', info: 'Cosecant function', boost: 85 },
  { name: 'cot', template: '\\cot', detail: 'cot', info: 'Cotangent function', boost: 85 },
  { name: 'ln', template: '\\ln', detail: 'ln', info: 'Natural logarithm', boost: 89 },
  { name: 'log', template: '\\log', detail: 'log', info: 'Logarithm', boost: 89 },
  { name: 'exp', template: '\\exp', detail: 'exp', info: 'Exponential function', boost: 89 },
  { name: 'max', template: '\\max', detail: 'max', info: 'Maximum operator', boost: 88 },
  { name: 'min', template: '\\min', detail: 'min', info: 'Minimum operator', boost: 88 }
];

export function createLatexCompletionSource(
  getBibEntries: () => BibEntry[],
  getDocumentLabels: () => Array<{ label: string; file: string; line: number }>,
  getActiveFile: () => string = () => ''
) {
  // Precompile command completions
  const commandCompletions: Completion[] = [
    // Standard command templates & direct environment shortcuts
    ...COMMAND_TEMPLATES.map(cmd =>
      snippetCompletion(cmd.template || `\\${cmd.name}`, {
        label: `\\${cmd.name}`,
        displayLabel: `\\${cmd.name}`,
        detail: cmd.detail || 'command',
        info: cmd.info,
        type: cmd.type || 'function',
        boost: cmd.boost ?? 70
      })
    )
  ];

  const bibEntryCompletions: Completion[] = BIBTEX_ENTRIES.map(entry =>
    snippetCompletion(entry.snippet, {
      label: `@${entry.type}`,
      displayLabel: `@${entry.type}`,
      detail: 'BibTeX entry',
      info: entry.info,
      type: 'class',
      boost: 99
    })
  );

  const bibFieldCompletions: Completion[] = BIBTEX_FIELDS.map(f =>
    snippetCompletion(f.template, {
      label: f.name,
      displayLabel: f.name,
      detail: 'field',
      info: f.info,
      type: 'property',
      boost: 90
    })
  );

  return function latexCompletionSource(context: CompletionContext): CompletionResult | null {
    const activeFile = getActiveFile().toLowerCase();
    const isBibFile = activeFile.endsWith('.bib');
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    // 1. BibTeX Entry Autocomplete: triggered by @ or inside .bib file
    const bibMatch = /@([a-zA-Z]*)$/.exec(textBefore);
    if (bibMatch) {
      const tokenStart = context.pos - bibMatch[0].length;
      return {
        from: tokenStart,
        options: bibEntryCompletions,
        validFor: /^@[a-zA-Z]*$/
      };
    }

    // 2. BibTeX Fields: if inside a .bib file or line looks like field assignment
    if (isBibFile) {
      const fieldMatch = /^\s*([a-zA-Z]*)$/.exec(textBefore);
      if (fieldMatch) {
        const tokenStart = context.pos - fieldMatch[1].length;
        return {
          from: tokenStart,
          options: [...bibFieldCompletions, ...bibEntryCompletions],
          validFor: /^[a-zA-Z]*$/
        };
      }
    }

    // 3. Contextual Argument: \cite{...} or \cite[...]{...}
    const citeMatch = /\\(cite[a-zA-Z*]*|nocite|parencite|textcite|autocite|citep|citet)\*?(\[[^\]]*\])*\{([^}]*)$/.exec(textBefore);
    if (citeMatch) {
      const argText = citeMatch[3];
      const lastComma = argText.lastIndexOf(',');
      const token = lastComma >= 0 ? argText.slice(lastComma + 1).trimStart() : argText.trimStart();
      const tokenStart = context.pos - token.length;
      const alreadyCited = new Set(
        argText.split(',').map(s => s.trim()).filter(Boolean)
      );
      alreadyCited.delete(token);
      const entries = getBibEntries();
      return {
        from: tokenStart,
        options: entries
          .filter(e => !alreadyCited.has(e.key))
          .map(entry => ({
            label: entry.key,
            type: 'keyword',
            detail: entry.year ? `(${entry.year}) [${entry.type}]` : `[${entry.type}]`,
            info: `${entry.title ? entry.title + '\n' : ''}${entry.author ? 'Author: ' + entry.author : ''}`.trim() || undefined,
            boost: 99
          }))
      };
    }

    // 4. Contextual Argument: \ref{...}, \eqref{...}, \pageref{...}
    const refMatch = /\\(ref|eqref|pageref|autoref|cref)\*?\{([^}]*)$/.exec(textBefore);
    if (refMatch) {
      const token = refMatch[2].trimStart();
      const tokenStart = context.pos - token.length;
      const labels = getDocumentLabels();
      return {
        from: tokenStart,
        options: labels.map(l => ({
          label: l.label,
          type: 'variable',
          detail: `line ${l.line} (${l.file.split(/[\\/]/).pop()})`,
          info: `Cross-reference label defined at line ${l.line}`,
          boost: 98
        }))
      };
    }

    // 5. Contextual Argument: \begin{...} -> SMART AUTOCOMPLETION
    // Completes environment name AND automatically pairs with \end{env}
    const beginMatch = /\\begin\{([^}]*)$/.exec(textBefore);
    if (beginMatch) {
      const token = beginMatch[1].trimStart();
      const tokenStart = context.pos - token.length;
      const nextChar = context.state.doc.sliceString(context.pos, context.pos + 1);
      const replaceEnd = nextChar === '}' ? context.pos + 1 : context.pos;

      return {
        from: tokenStart,
        to: replaceEnd,
        options: ENVIRONMENTS.map(env =>
          snippetCompletion(`${env.name}}\n\t\${1}\n\\end{${env.name}}`, {
            label: env.name,
            displayLabel: env.name,
            type: 'class',
            detail: `auto \\end{${env.name}}`,
            info: env.info,
            boost: 98
          })
        )
      };
    }

    // 6. Contextual Argument: \end{...}
    const endMatch = /\\end\{([^}]*)$/.exec(textBefore);
    if (endMatch) {
      const token = endMatch[1].trimStart();
      const tokenStart = context.pos - token.length;
      return {
        from: tokenStart,
        options: ENVIRONMENTS.map(env => ({
          label: env.name,
          type: 'class',
          detail: 'environment',
          info: env.info,
          boost: 96
        }))
      };
    }

    // 7. Contextual Argument: \usepackage{...}
    const pkgMatch = /\\usepackage(\[[^\]]*\])?\{([^}]*)$/.exec(textBefore);
    if (pkgMatch) {
      const argText = pkgMatch[2];
      const lastComma = argText.lastIndexOf(',');
      const token = lastComma >= 0 ? argText.slice(lastComma + 1).trimStart() : argText.trimStart();
      const tokenStart = context.pos - token.length;
      const alreadyIncluded = new Set(
        argText.split(',').map(s => s.trim()).filter(Boolean)
      );
      alreadyIncluded.delete(token);
      return {
        from: tokenStart,
        options: COMMON_PACKAGES
          .filter(pkg => !alreadyIncluded.has(pkg))
          .map(pkg => ({
            label: pkg,
            type: 'type',
            detail: 'package',
            info: `LaTeX package: ${pkg}`,
            boost: 95
          }))
      };
    }

    // 8. Contextual Argument: \bibliography{...}
    const biblioMatch = /\\bibliography\{([^}]*)$/.exec(textBefore);
    if (biblioMatch) {
      const argText = biblioMatch[1];
      const lastComma = argText.lastIndexOf(',');
      const token = lastComma >= 0 ? argText.slice(lastComma + 1).trimStart() : argText.trimStart();
      const tokenStart = context.pos - token.length;
      const bibFiles: string[] = [...new Set(getBibEntries().map(e => e.file.split(/[\\/]/).pop()?.replace(/\.bib$/i, '')).filter((f): f is string => !!f))];
      return {
        from: tokenStart,
        options: (bibFiles.length ? bibFiles : ['references', 'bibliography']).map(f => ({
          label: f,
          type: 'constant',
          detail: 'bib database',
          info: `BibTeX bibliography file: ${f}.bib`,
          boost: 95
        }))
      };
    }

    // 8. Contextual Argument: \documentclass{...}
    const clsMatch = /\\documentclass(\[[^\]]*\])?\{([^}]*)$/.exec(textBefore);
    if (clsMatch) {
      const token = clsMatch[2].trimStart();
      const tokenStart = context.pos - token.length;
      return {
        from: tokenStart,
        options: DOCUMENT_CLASSES.map(cls => ({
          label: cls,
          type: 'type',
          detail: 'document class',
          info: `Standard document class: ${cls}`,
          boost: 95
        }))
      };
    }

    // 9. General LaTeX Command Autocomplete: triggered by \ and matching word characters
    const cmdMatch = /\\[a-zA-Z*]*$/.exec(textBefore);
    if (cmdMatch) {
      const tokenStart = context.pos - cmdMatch[0].length;
      return {
        from: tokenStart,
        options: commandCompletions,
        validFor: /^\\[a-zA-Z*]*$/
      };
    }

    // 10. If explicit Ctrl+Space or typing inside a word
    if (context.explicit) {
      if (isBibFile) {
        return {
          from: context.pos,
          options: [...bibFieldCompletions, ...bibEntryCompletions]
        };
      }
      const word = context.matchBefore(/[a-zA-Z]+/);
      return {
        from: word ? word.from : context.pos,
        options: commandCompletions
      };
    }

    return null;
  };
}
