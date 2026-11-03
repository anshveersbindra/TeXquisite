import {documentOutline} from './document-outline';
import {createSvg, fileTypeIcon} from './icons';

type ProjectState = {
  root?: string;
  active?: string;
  projectFolder?: string;
  projectSidebar?: boolean;
  supportFolders?: string[];
  docs: { path: string; text: string }[];
};

interface FileEntry {
  name: string;
  path: string;
  directory: boolean;
  size?: number;
}

export class ProjectSidebar {
  private state: ProjectState = { docs: [] };
  private key = '';
  private epoch = 0;
  private outlineText: string | undefined;
  private outlineFile: string | undefined;
  private timer = 0;
  private filterTimer = 0;
  private clipboard: { path: string; action: 'copy' | 'cut' } | undefined;

  private host = document.getElementById('projectSidebar')!;
  private files = document.getElementById('projectFiles')!;
  private outline = document.getElementById('documentOutline')!;

  constructor(
    private call: (method: string, ...args: unknown[]) => Promise<any>,
    private open: (file: string) => void,
    private jump: (file: string, text: string, at: number) => void
  ) {
    // Header buttons
    const refreshBtn = document.getElementById('refreshProject');
    if (refreshBtn) refreshBtn.onclick = () => void this.refresh();

    const openFolderBtn = document.getElementById('openFolder');
    if (openFolderBtn) {
      openFolderBtn.onclick = async () => {
        const next = await this.call('openFolder');
        if (next) {
          this.update(next);
          void this.refresh();
        }
      };
    }

    const newFileBtn = document.getElementById('newProjectFile');
    if (newFileBtn) {
      newFileBtn.onclick = () => void this.promptCreateFile();
    }

    const newFolderBtn = document.getElementById('newProjectFolder');
    if (newFolderBtn) {
      newFolderBtn.onclick = () => void this.promptCreateFolder();
    }

    const uploadBtn = document.getElementById('uploadProjectFiles');
    if (uploadBtn) {
      uploadBtn.onclick = async () => {
        const target = this.getActiveFolder();
        const res = await this.call('promptUploadFiles', target);
        if (res) void this.refresh();
      };
    }

    // Drag-and-drop file import from Finder / Explorer
    this.host.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      this.host.classList.add('drag-over');
    });
    this.host.addEventListener('dragleave', (e: DragEvent) => {
      if (!this.host.contains(e.relatedTarget as Node)) {
        this.host.classList.remove('drag-over');
      }
    });
    this.host.addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault();
      this.host.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer?.files ?? []);
      const filePaths = files.map((f: any) => f.path).filter(Boolean);
      if (!filePaths.length) return;
      const target = this.getActiveFolder();
      if (!target) return;
      await this.call('copyFiles', target, filePaths);
      void this.refresh();
    });

    const filterInput = document.getElementById('projectFileFilter') as HTMLInputElement | null;
    if (filterInput) {
      filterInput.oninput = () => {
        window.clearTimeout(this.filterTimer);
        this.filterTimer = window.setTimeout(() => void this.refresh(), 200);
      };
    }
  }

  private getActiveFolder(): string {
    if (this.state.projectFolder) return this.state.projectFolder;
    if (this.state.root) {
      const idx = Math.max(this.state.root.lastIndexOf('/'), this.state.root.lastIndexOf('\\'));
      return idx > 0 ? this.state.root.slice(0, idx) : this.state.root;
    }
    return '';
  }

  private async promptModal(title: string, folderHint: string, defaultValue = ''): Promise<string | null> {
    const dialog = document.getElementById('fileActionDialog') as HTMLDialogElement | null;
    if (!dialog) {
      const result = window.prompt(`${title} (in ${folderHint}):`, defaultValue);
      return result ? result.trim() : null;
    }
    const titleEl = document.getElementById('fileActionTitle')!;
    const folderEl = document.getElementById('fileActionFolder')!;
    const inputEl = document.getElementById('fileActionInput') as HTMLInputElement;
    const form = document.getElementById('fileActionForm') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancelFileAction')!;

    titleEl.textContent = title;
    folderEl.textContent = `Target directory: ${folderHint}`;
    inputEl.value = defaultValue;

    return new Promise(resolve => {
      let resolved = false;
      const cleanUp = () => {
        if (!resolved) {
          resolved = true;
          dialog.close();
        }
      };
      form.onsubmit = e => {
        e.preventDefault();
        cleanUp();
        resolve(inputEl.value.trim() || null);
      };
      cancelBtn.onclick = () => {
        cleanUp();
        resolve(null);
      };
      dialog.onclose = () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      };
      dialog.showModal();
      inputEl.focus();
      inputEl.select();
    });
  }

  private async promptCreateFile(targetFolder?: string) {
    const folder = targetFolder || this.getActiveFolder();
    if (!folder) {
      alert('Please open a project folder or document first.');
      return;
    }
    const name = await this.promptModal('Create New File', folder.split(/[\\/]/).at(-1) || folder, 'newfile.tex');
    if (!name) return;
    try {
      await this.call('createFile', folder, name);
      await this.refresh();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  private async promptCreateFolder(targetFolder?: string) {
    const folder = targetFolder || this.getActiveFolder();
    if (!folder) {
      alert('Please open a project folder or document first.');
      return;
    }
    const name = await this.promptModal('Create New Folder', folder.split(/[\\/]/).at(-1) || folder, 'newfolder');
    if (!name) return;
    try {
      await this.call('createFolder', folder, name);
      await this.refresh();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  private async promptRename(targetPath: string) {
    const oldName = targetPath.split(/[\\/]/).at(-1) || '';
    const parent = targetPath.slice(0, targetPath.length - oldName.length - 1);
    const newName = await this.promptModal(`Rename "${oldName}"`, parent.split(/[\\/]/).at(-1) || parent, oldName);
    if (!newName || newName === oldName) return;
    try {
      await this.call('renameEntry', targetPath, newName);
      await this.refresh();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  private async confirmDelete(targetPath: string, isDirectory: boolean) {
    const name = targetPath.split(/[\\/]/).at(-1) || targetPath;
    const kind = isDirectory ? 'folder' : 'file';
    if (!window.confirm(`Move ${kind} "${name}" to the Trash?`)) return;
    try {
      await this.call('deleteEntry', targetPath);
      await this.refresh();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  private async handlePaste(destFolder: string) {
    if (!this.clipboard) return;
    try {
      if (this.clipboard.action === 'cut') {
        await this.call('moveEntry', this.clipboard.path, destFolder);
        this.clipboard = undefined;
      } else {
        await this.call('copyEntry', this.clipboard.path, destFolder);
      }
      await this.refresh();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  update(state: ProjectState) {
    this.state = state;
    this.host.hidden = !state.projectSidebar;
    const toggle = document.getElementById('toggleProject');
    if (toggle) toggle.setAttribute('aria-expanded', String(!!state.projectSidebar));

    if (!state.projectSidebar) {
      window.clearTimeout(this.timer);
      this.outlineFile = undefined;
      return;
    }

    const root = document.getElementById('projectRoot')!;
    root.replaceChildren();
    if (state.projectFolder) {
      const folderName = state.projectFolder.split(/[\\/]/).at(-1) || state.projectFolder;
      root.append(createSvg('folder', 14), ' ' + folderName);
      root.title = `Project Folder: ${state.projectFolder}`;
    } else if (state.root) {
      const rootName = state.root.split(/[\\/]/).at(-1) || state.root;
      root.append(createSvg('starFilled', 14), ' ' + rootName);
      root.title = `Root: ${state.root}`;
    } else {
      root.textContent = 'Open a folder or document';
      root.title = '';
    }

    const key = JSON.stringify([state.root, state.projectFolder, state.supportFolders]);
    if (key !== this.key) {
      this.key = key;
      void this.refresh();
    }

    // Update active highlight in tree
    for (const item of this.files.querySelectorAll<HTMLElement>('[data-project-file]')) {
      const isActive = item.dataset.projectFile === state.active;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    }

    // Outline update
    const doc = state.docs.find(d => d.path === state.active);
    if (doc?.path === this.outlineFile && doc?.text === this.outlineText) return;
    this.outlineFile = doc?.path;
    this.outlineText = doc?.text;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.renderOutline(), 200);
  }

  private renderOutline() {
    const doc = this.state.docs.find(d => d.path === this.state.active);
    this.outline.replaceChildren();
    const fileLabel = document.getElementById('outlineFile')!;
    fileLabel.textContent = doc?.path.split(/[\\/]/).at(-1) ?? '';

    if (!doc) return;
    const file = doc.path, text = doc.text, entries = documentOutline(text);
    const levelNames = ['Part', 'Chap', 'Sec', 'Sub', 'Subsub', 'Para', 'Subpara'];
    for (const item of entries) {
      const button = document.createElement('button');
      button.className = 'outline-item';
      const badge = document.createElement('span');
      badge.className = 'outline-level-badge';
      badge.textContent = levelNames[item.level] ?? 'Sec';
      const label = document.createElement('span');
      label.className = 'outline-label';
      label.textContent = item.label;
      button.append(badge, label);
      button.title = `${item.label} (line ${item.line})`;
      button.style.paddingLeft = (6 + Math.min(item.level, 4) * 8) + 'px';
      button.dataset.outlineAt = String(item.at);
      button.onclick = () => this.jump(file, text, item.at);
      this.outline.append(button);
    }
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'outline-empty';
      empty.textContent = 'No section headings found in this file.';
      this.outline.append(empty);
    }
  }

  async refresh() {
    const epoch = ++this.epoch;
    this.files.replaceChildren();
    if (!this.state.projectSidebar) return;

    try {
      const result = await this.call('projectFolders');
      if (epoch !== this.epoch) return;

      if (!result.folders || !result.folders.length) {
        const empty = document.createElement('p');
        empty.className = 'project-empty';
        empty.append(createSvg('folder', 14), ' No project opened. Open a folder to begin.');
        this.files.append(empty);
        return;
      }

      for (const folder of result.folders) {
        const group = document.createElement('details');
        const summary = document.createElement('summary');
        const children = document.createElement('div');

        const isMain = folder === result.folders[0];
        const folderName = folder.split(/[\\/]/).at(-1) || folder;

        const summaryLabel = document.createElement('span');
        summaryLabel.className = 'tree-label';
        summaryLabel.append(createSvg('folder', 14), ' ' + (isMain ? folderName : 'Support: ' + folderName));
        summary.append(summaryLabel);
        summary.title = folder;

        // Context actions on folder header
        const folderActions = document.createElement('span');
        folderActions.className = 'tree-actions';

        const addFileBtn = document.createElement('button');
        addFileBtn.append(createSvg('newFile', 13));
        addFileBtn.title = 'New file in this folder';
        addFileBtn.onclick = e => {
          e.stopPropagation();
          void this.promptCreateFile(folder);
        };

        const addFolderBtn = document.createElement('button');
        addFolderBtn.append(createSvg('newFolder', 13));
        addFolderBtn.title = 'New folder here';
        addFolderBtn.onclick = e => {
          e.stopPropagation();
          void this.promptCreateFolder(folder);
        };

        folderActions.append(addFileBtn, addFolderBtn);

        if (this.clipboard) {
          const pasteBtn = document.createElement('button');
          pasteBtn.append(createSvg('paste', 13));
          pasteBtn.title = `Paste ${this.clipboard.action === 'cut' ? '(move)' : '(copy)'} here`;
          pasteBtn.onclick = e => {
            e.stopPropagation();
            void this.handlePaste(folder);
          };
          folderActions.append(pasteBtn);
        }

        summary.append(folderActions);
        group.append(summary, children);
        this.files.append(group);

        let loaded = false;
        group.ontoggle = () => {
          if (group.open && !loaded) {
            loaded = true;
            void this.load(folder, children, epoch);
          }
        };
        group.open = isMain;
      }
    } catch (e) {
      if (epoch === this.epoch) this.files.textContent = String(e);
    }
  }

  private async load(folder: string, host: HTMLElement, epoch: number) {
    try {
      const filter = (document.getElementById('projectFileFilter') as HTMLInputElement | null)?.value || '';
      const result = await this.call('projectFiles', folder, filter);
      if (epoch !== this.epoch || !host.isConnected) return;
      host.replaceChildren();

      for (const entry of result.entries as FileEntry[]) {
        if (entry.directory) {
          const group = document.createElement('details');
          const summary = document.createElement('summary');
          const children = document.createElement('div');

          const icon = document.createElement('span');
          icon.className = 'tree-icon';
          icon.append(createSvg('folder', 14));

          const label = document.createElement('span');
          label.className = 'tree-name';
          label.textContent = entry.name;

          summary.append(icon, label);

          // Subdirectory actions
          const actions = document.createElement('span');
          actions.className = 'tree-actions';

          const addFile = document.createElement('button');
          addFile.append(createSvg('newFile', 12));
          addFile.title = 'New file inside';
          addFile.onclick = e => {
            e.stopPropagation();
            void this.promptCreateFile(entry.path);
          };

          const addSub = document.createElement('button');
          addSub.append(createSvg('newFolder', 12));
          addSub.title = 'New folder inside';
          addSub.onclick = e => {
            e.stopPropagation();
            void this.promptCreateFolder(entry.path);
          };

          const renameBtn = document.createElement('button');
          renameBtn.append(createSvg('rename', 12));
          renameBtn.title = 'Rename folder';
          renameBtn.onclick = e => {
            e.stopPropagation();
            void this.promptRename(entry.path);
          };

          const copyBtn = document.createElement('button');
          copyBtn.append(createSvg('copy', 12));
          copyBtn.title = 'Copy folder';
          copyBtn.onclick = e => {
            e.stopPropagation();
            this.clipboard = { path: entry.path, action: 'copy' };
            void this.refresh();
          };

          const cutBtn = document.createElement('button');
          cutBtn.append(createSvg('cut', 12));
          cutBtn.title = 'Cut folder';
          cutBtn.onclick = e => {
            e.stopPropagation();
            this.clipboard = { path: entry.path, action: 'cut' };
            void this.refresh();
          };

          const delBtn = document.createElement('button');
          delBtn.append(createSvg('delete', 12));
          delBtn.title = 'Delete folder (Move to Trash)';
          delBtn.onclick = e => {
            e.stopPropagation();
            void this.confirmDelete(entry.path, true);
          };

          actions.append(addFile, addSub, renameBtn, copyBtn, cutBtn, delBtn);

          if (this.clipboard) {
            const pasteBtn = document.createElement('button');
            pasteBtn.append(createSvg('paste', 12));
            pasteBtn.title = `Paste into "${entry.name}"`;
            pasteBtn.onclick = e => {
              e.stopPropagation();
              void this.handlePaste(entry.path);
            };
            actions.append(pasteBtn);
          }

          summary.append(actions);
          group.append(summary, children);
          host.append(group);

          let loaded = false;
          group.ontoggle = () => {
            if (group.open && !loaded) {
              loaded = true;
              void this.load(entry.path, children, epoch);
            }
          };
        } else {
          // File entry
          const item = document.createElement('div');
          item.className = 'tree-item';
          item.dataset.projectFile = entry.path;
          item.classList.toggle('active', entry.path === this.state.active);

          const left = document.createElement('div');
          left.className = 'tree-label';

          const icon = document.createElement('span');
          icon.className = 'tree-icon';
          icon.append(createSvg(fileTypeIcon(entry.name, false), 14));

          const name = document.createElement('span');
          name.className = 'tree-name';
          name.textContent = entry.name;
          left.append(icon, name);

          const isRoot = entry.path === this.state.root;
          if (isRoot) {
            const badge = document.createElement('span');
            badge.className = 'tree-badge';
            badge.append(createSvg('starFilled', 10), ' ROOT');
            left.append(badge);
          }

          // Action buttons on hover
          const actions = document.createElement('div');
          actions.className = 'tree-actions';

          if (/\.tex$/i.test(entry.name) && !isRoot) {
            const rootBtn = document.createElement('button');
            rootBtn.append(createSvg('star', 12));
            rootBtn.title = 'Set as root document';
            rootBtn.onclick = async e => {
              e.stopPropagation();
              await this.call('selectRoot', entry.path);
              await this.refresh();
            };
            actions.append(rootBtn);
          }

          const renameBtn = document.createElement('button');
          renameBtn.append(createSvg('rename', 12));
          renameBtn.title = 'Rename';
          renameBtn.onclick = e => {
            e.stopPropagation();
            void this.promptRename(entry.path);
          };

          const copyBtn = document.createElement('button');
          copyBtn.append(createSvg('copy', 12));
          copyBtn.title = 'Copy';
          copyBtn.onclick = e => {
            e.stopPropagation();
            this.clipboard = { path: entry.path, action: 'copy' };
            void this.refresh();
          };

          const cutBtn = document.createElement('button');
          cutBtn.append(createSvg('cut', 12));
          cutBtn.title = 'Cut';
          cutBtn.onclick = e => {
            e.stopPropagation();
            this.clipboard = { path: entry.path, action: 'cut' };
            void this.refresh();
          };

          const delBtn = document.createElement('button');
          delBtn.append(createSvg('delete', 12));
          delBtn.title = 'Delete (Move to Trash)';
          delBtn.onclick = e => {
            e.stopPropagation();
            void this.confirmDelete(entry.path, false);
          };

          actions.append(renameBtn, copyBtn, cutBtn, delBtn);

          item.append(left, actions);
          item.title = entry.path;
          item.onclick = () => this.open(entry.path);

          host.append(item);
        }
      }

      if (result.limited) {
        const message = document.createElement('p');
        message.textContent = 'Showing first 500 entries. Use filter to narrow.';
        host.append(message);
      } else if (!result.entries.length) {
        const message = document.createElement('p');
        message.textContent = 'No matching files.';
        host.append(message);
      }
    } catch (e) {
      if (epoch === this.epoch) host.textContent = String(e);
    }
  }
}
