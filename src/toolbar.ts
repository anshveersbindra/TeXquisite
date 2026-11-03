const paths: Record<string, string> = {
  lecture: 'M3 3h18v13H3z M12 16v5 M7 21l5-5 5 5 M7 7h10 M7 11h6',
  project: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  new: 'M14 3H5v18h14V8z M14 3v6h6 M8 15h8M12 11v8',
  open: 'M3 7h7l2 2h9l-3 11H3z M3 7V4h7l2 3',
  save: 'M4 3h14l3 3v15H3V3z M7 3v7h10V3 M7 21v-8h10v8',
  reload: 'M20 10a8 8 0 1 0-1 8 M20 4v6h-6',
  copy: 'M8 8h13v13H8z M16 8V3H3v13h5',
  build: 'M7 3l14 9-14 9z',
  pause: 'M7 4v16M17 4v16',
  live: 'M13 2L4 14h7l-1 8 10-13h-8z',
  cancel: 'M5 5h14v14H5z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  support: 'M8 13l7-7a4 4 0 0 1 6 6L11 22a6 6 0 0 1-8-8L13 4',
  root: 'M4 3h12l4 4v14H4z M8 15l3 3 6-7',
  braces: 'M9 3H7v7l-3 2 3 2v7h2 M15 3h2v7l3 2-3 2v7h-2',
  previous: 'M4 6v6h6 M4 12a8 8 0 1 1 3 7 M12 7v6l4 2',
  export: 'M12 3v12M7 8l5-5 5 5 M4 14v7h16v-7',
  left: 'M15 4l-8 8 8 8',
  right: 'M9 4l8 8-8 8',
  locate: 'M12 2v5M12 17v5M2 12h5M17 12h5 M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
  follow: 'M4 3l6 18 3-8 8-3z',
  edit: 'M4 16L16 4l4 4L8 20H4z M13 7l4 4',
  status: 'M3 4h18v16H3z M3 15h18 M7 18h3',
  log: 'M4 5h16M4 10h16M4 15h10M4 20h10',
  panels: 'M3 4h18v16H3z M12 4v16',
  pages: 'M6 3h13v15H6z M3 7v14h13',
  zoom: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l7 7 M7 10h6M10 7v6',
  theme: 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z',
  pdfInvert: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16v16z'
};

function svg(name: string, strokeColor = 'currentColor') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="${strokeColor}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] ?? paths.menu}"/></svg>`;
}

export function toolbarButton(id: string, name: string, label: string) {
  const button = document.getElementById(id);
  if (!button) return;
  if (button.dataset.icon !== name) {
    button.innerHTML = svg(name);
    button.dataset.icon = name;
  }
  button.classList.add('icon-button');
  button.title = label;
  button.setAttribute('aria-label', label);
}

const selects: [string, string, string][] = [
  ['panelLayout', 'panels', 'Panel layout'],
  ['layoutMode', 'pages', 'Preview layout'],
  ['zoom', 'zoom', 'Preview zoom']
];

export function toolbarSelect(id: string, name: string, label: string, isDark?: boolean) {
  const select = document.getElementById(id) as HTMLSelectElement | null;
  if (!select) return;
  const dark = isDark ?? (document.documentElement.dataset.isDark === 'true');
  const color = dark ? '#f3f4f6' : '#2d453b';
  select.classList.add('icon-select');
  select.title = label;
  select.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg(name, color))}")`;
}

export function updateToolbarSelects(isDark?: boolean) {
  for (const [id, name, label] of selects) {
    toolbarSelect(id, name, label, isDark);
  }
}

export function installToolbar() {
  const buttons: [string, string, string][] = [
    ['toggleProject', 'project', 'Show or hide project files and outline'],
    ['openFolderHeader', 'folder', 'Open project folder (Ctrl+Shift+O)'],
    ['new', 'new', 'New document'],
    ['open', 'open', 'Open document (Ctrl+O)'],
    ['save', 'save', 'Save (Ctrl+S)'],
    ['reload', 'reload', 'Reload the disk version'],
    ['saveCopy', 'copy', 'Save a copy'],
    ['build', 'build', 'Build now (Ctrl+B)'],
    ['live', 'pause', 'Pause automatic saving and preview'],
    ['cancel', 'cancel', 'Cancel build'],
    ['settings', 'settings', 'Settings'],
    ['support', 'support', 'Add support folders'],
    ['root', 'root', 'Use active file as root'],
    ['autoClose', 'braces', 'Automatically close TeX pairs'],
    ['previous', 'previous', 'Show previous verified PDF'],
    ['export', 'export', 'Export verified PDF'],
    ['prevPage', 'left', 'Previous PDF page'],
    ['nextPage', 'right', 'Next PDF page'],
    ['editPreview', 'edit', 'Edit verified text and math in the preview'],
    ['locate', 'locate', 'Show source cursor in PDF (Ctrl+Enter)'],
    ['follow', 'follow', 'Follow typing in the preview'],
    ['toggleStatus', 'status', 'Show or hide preview timing details'],
    ['toggleProblems', 'log', 'Show or hide project problems'],
    ['toggleLog', 'log', 'Show or hide the build log']
  ];
  for (const args of buttons) toolbarButton(...args);
  updateToolbarSelects();
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-math]')) {
    button.classList.add('math-icon');
    button.setAttribute('aria-label', button.title);
    const label = ({
      frac: 'a/b',
      sqrt: '√x',
      inline: '$ $',
      display: '\\[ \\]',
      sum: '∑',
      int: '∫',
      sup: 'xⁿ',
      sub: 'xₙ',
      pi: 'π'
    } as Record<string, string>)[button.dataset.math!];
    if (label) button.textContent = label;
  }
}
