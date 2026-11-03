import {app,Menu,MenuItemConstructorOptions} from 'electron';

export interface Preferences {
  previewMode?: 'lecture'|'document';
  projectSidebar?: boolean;
  onSave: boolean;
  backups?: boolean;
  autoClose?: boolean;
  followPreview?: boolean;
  previewEditing?: boolean;
  continuousPreview?: boolean;
  statusBar?: boolean;
  zoom?: number|'fit-width';
  panelLayout?: {mode:string};
  theme?: 'auto'|'dark'|'midnight'|'nord'|'monokai'|'overleaf'|'overleaf-dark'|'light'|'warm';
  pdfInvert?: boolean;
}

export function appMenu(state:Preferences, send:(action:string, value?:string)=>void){
  const isMac = process.platform === 'darwin';
  const action=(label:string, id:string, accelerator?:string):MenuItemConstructorOptions=>({
    label,
    id,
    accelerator,
    click:()=>send(id)
  });
  const toggle=(label:string, id:string, checked:boolean, accelerator?:string):MenuItemConstructorOptions=>({
    label,
    id,
    type:'checkbox',
    checked,
    accelerator,
    click:()=>send(id)
  });
  const select=(label:string, id:string, value:string, checked:boolean):MenuItemConstructorOptions=>({
    label,
    id:id+'-'+value,
    type:'radio',
    checked,
    click:()=>send(id,value)
  });

  const template: MenuItemConstructorOptions[] = [];

  // macOS Native Application Menu
  if (isMac) {
    template.push({
      label: 'TeXquisite',
      submenu: [
        { role: 'about', label: 'About TeXquisite' },
        { type: 'separator' },
        action('Preferences / Build Settings…', 'settings', 'CmdOrCtrl+,'),
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide TeXquisite' },
        { role: 'hideOthers', label: 'Hide Others' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit TeXquisite' }
      ]
    });
  }

  // File Menu
  template.push({
    label: 'File',
    id: 'file-menu',
    submenu: [
      action('New document…', 'new', 'CmdOrCtrl+N'),
      action('Open document…', 'open', 'CmdOrCtrl+O'),
      action('Open folder…', 'openFolder', 'CmdOrCtrl+Shift+O'),
      { type: 'separator' },
      action('Save', 'save', 'CmdOrCtrl+S'),
      action('Save a copy…', 'saveCopy', 'CmdOrCtrl+Shift+S'),
      action('Reload disk version', 'reload', 'CmdOrCtrl+R'),
      {
        label: 'Backups',
        submenu: [
          toggle('Automatic source backups', 'automaticBackups', state.backups !== false),
          action('Back up now', 'backupNow'),
          action('Browse and recover…', 'browseBackups')
        ]
      },
      { type: 'separator' },
      action('Add support folders…', 'support'),
      action('Use active file as root', 'root'),
      { type: 'separator' },
      action('Export PDF…', 'export', 'CmdOrCtrl+Shift+E'),
      action('Show previous verified PDF', 'previous'),
      { type: 'separator' },
      action('Close Tab', 'closeTab', 'CmdOrCtrl+W'),
      { role: 'close', label: isMac ? 'Close Window' : 'Close window', accelerator: 'CmdOrCtrl+Shift+W' }
    ]
  });

  // Edit Menu
  template.push({
    label: 'Edit',
    id: 'edit-menu',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      action('Paste image…', 'pasteImage', 'CmdOrCtrl+Shift+V'),
      { role: 'selectAll' },
      { type: 'separator' },
      { ...action('Find and replace in project…', 'projectSearch'), accelerator: 'CmdOrCtrl+Shift+F' },
      { type: 'separator' },
      toggle('Match pairs', 'autoClose', state.autoClose !== false)
    ]
  });

  // View Menu
  template.push({
    label: 'View',
    id: 'view-menu',
    submenu: [
      {
        label: 'Appearance & Theme',
        submenu: [
          select('System (Automatic)', 'theme', 'auto', !state.theme || state.theme === 'auto'),
          select('Dark (Obsidian)', 'theme', 'dark', state.theme === 'dark'),
          select('Midnight (OLED Black)', 'theme', 'midnight', state.theme === 'midnight'),
          select('Nord (Arctic Navy)', 'theme', 'nord', state.theme === 'nord'),
          select('Monokai (Vibrant Dark)', 'theme', 'monokai', state.theme === 'monokai'),
          select('Overleaf (Classic Light)', 'theme', 'overleaf', state.theme === 'overleaf'),
          select('Overleaf Dark', 'theme', 'overleaf-dark', state.theme === 'overleaf-dark'),
          select('Light (Studio)', 'theme', 'light', state.theme === 'light'),
          select('Warm (Sepia Paper)', 'theme', 'warm', state.theme === 'warm'),
          { type: 'separator' },
          toggle('Invert PDF in Dark Themes', 'togglePdfInvert', !!state.pdfInvert)
        ]
      },
      { type: 'separator' },
      toggle('Project files and outline', 'toggleProject', !!state.projectSidebar, 'CmdOrCtrl+Shift+P'),
      {
        label: 'Panel layout',
        submenu: [
          select('Side by side', 'panelLayout', 'side-by-side', !state.panelLayout || state.panelLayout.mode === 'side-by-side'),
          select('Output above source', 'panelLayout', 'output-top', state.panelLayout?.mode === 'output-top'),
          select('Source above output', 'panelLayout', 'source-top', state.panelLayout?.mode === 'source-top')
        ]
      },
      {
        label: 'Preview layout',
        submenu: [
          select('Paged PDF', 'layoutMode', 'paged', !state.continuousPreview),
          select('Continuous scroll', 'layoutMode', 'continuous', !!state.continuousPreview)
        ]
      },
      {
        label: 'Zoom',
        submenu: [
          action('Zoom In', 'zoomIn', 'CmdOrCtrl+='),
          action('Zoom Out', 'zoomOut', 'CmdOrCtrl+-'),
          action('Reset Zoom', 'zoomReset', 'CmdOrCtrl+0'),
          select('Fit width', 'zoom', 'fit-width', state.zoom === 'fit-width'),
          ...([0.8, 1, 1.25, 1.5, 2].map(value => select(`${value * 100}%`, 'zoom', String(value), (state.zoom ?? 1) === value)))
        ]
      },
      { type: 'separator' },
      toggle('Follow typing', 'follow', !!state.followPreview),
      { ...toggle('Edit verified preview', 'editPreview', !!state.previewEditing), enabled: !state.continuousPreview },
      action('Show source cursor in PDF', 'locate', 'CmdOrCtrl+Enter'),
      action('Previous PDF page', 'prevPage', 'Alt+Left'),
      action('Next PDF page', 'nextPage', 'Alt+Right'),
      {
        label: 'Math editing',
        submenu: [
          action('Insert fraction', 'math-frac', 'Alt+F'),
          action('Insert square root', 'math-sqrt', 'Alt+R'),
          action('Insert inline math ($...$)', 'math-inline', 'Alt+M'),
          action('Insert display math (\\[...\\])', 'math-display', 'Alt+D'),
          action('Insert summation', 'math-sum', 'Alt+S'),
          action('Insert integral', 'math-int', 'Alt+I'),
          action('Insert superscript', 'math-sup', 'Alt+Shift+6'),
          action('Insert subscript', 'math-sub', 'Alt+-'),
          action('Insert pi', 'math-pi', 'Alt+P')
        ]
      },
      { type: 'separator' },
      toggle('Show preview timing details', 'toggleStatus', state.statusBar !== false),
      action('Show or hide problems', 'toggleProblems'),
      action('Show or hide build log', 'toggleLog'),
      { type: 'separator' },
      { role: 'togglefullscreen' },
      { role: 'toggleDevTools' }
    ]
  });

  // Build Menu
  template.push({
    label: 'Build',
    id: 'build-menu',
    submenu: [
      action('Build now', 'build', 'CmdOrCtrl+B'),
      toggle('Automatically save and rebuild', 'live', state.onSave),
      action('Cancel build', 'cancel', 'Escape'),
      { type: 'separator' },
      {
        label: 'Working mode',
        submenu: [
          select('Lecture — prioritize live preview', 'previewMode', 'lecture', state.previewMode === 'lecture'),
          select('Document — verify full document while idle', 'previewMode', 'document', state.previewMode !== 'lecture')
        ]
      },
      { type: 'separator' },
      action('Copy performance report', 'copyPerformanceReport'),
      ...(isMac ? [] : [action('Settings…', 'settings', 'CmdOrCtrl+,')])
    ]
  });

  // Window Menu (macOS standard)
  if (isMac) {
    template.push({
      label: 'Window',
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    });
  }

  return Menu.buildFromTemplate(template);
}
