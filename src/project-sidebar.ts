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
      const desktop = (window as any).desktop;
      const filePaths: string[] = [];
      for (const f of files) {
        const p = desktop?.getPathForFile ? desktop.getPathForFile(f) : (f as any).path;
        if (p) filePaths.push(p);
      }
      if (!filePaths.length) return;
      const target = this.getActiveFolder();
      if (!target) return;
      await this.call('copyFiles', target, filePaths);
      void this.refresh();
    });

    const toggleAllBtn = document.getElementById('toggleAllOutline');
    if (toggleAllBtn) {
      toggleAllBtn.onclick = (e) => {
        e.stopPropagation();
        const nodes = Array.from(this.outline.querySelectorAll<HTMLElement>('.outline-tree-node'));
        const someCollapsed = nodes.some(n => n.classList.contains('collapsed'));
        for (const n of nodes) {
          n.classList.toggle('collapsed', !someCollapsed);
          const btn = n.querySelector<HTMLButtonElement>('.outline-toggle-btn');
          if (btn) btn.replaceChildren(createSvg(!someCollapsed ? 'chevronRight' : 'chevronDown', 10));
        }
        toggleAllBtn.textContent = !someCollapsed ? 'Expand all' : 'Collapse all';
      };
    }

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
    // Filter strictly to headings: part, chapter, section, subsection, subsubsection, paragraph, subparagraph
    const sectionEntries = entries.filter(e => e.kind === 'section' || e.level >= 0);
    const levelNames = ['Part', 'Chap', 'Sec', 'Sub', 'Subsub', 'Para', 'Subpara'];

    interface OutlineNode {
      item: (typeof entries)[number];
      children: OutlineNode[];
    }
    const roots: OutlineNode[] = [];
    const stack: OutlineNode[] = [];
    for (const item of sectionEntries) {
      const node: OutlineNode = { item, children: [] };
      while (stack.length > 0 && stack[stack.length - 1].item.level >= item.level) {
        stack.pop();
      }
      if (stack.length === 0) {
        roots.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }
      stack.push(node);
    }

    const renderNode = (node: OutlineNode, container: HTMLElement) => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'outline-tree-node';
      nodeEl.dataset.level = String(node.item.level);

      const row = document.createElement('div');
      row.className = 'outline-item-row';

      if (node.children.length > 0) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'outline-toggle-btn';
        toggleBtn.title = 'Expand / Collapse';
        toggleBtn.setAttribute('aria-label', 'Toggle branch');
        toggleBtn.append(createSvg('chevronDown', 10));
        toggleBtn.onclick = (e) => {
          e.stopPropagation();
          nodeEl.classList.toggle('collapsed');
          toggleBtn.replaceChildren(createSvg(nodeEl.classList.contains('collapsed') ? 'chevronRight' : 'chevronDown', 10));
        };
        row.append(toggleBtn);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'outline-leaf-bullet';
        row.append(spacer);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'outline-item';
      button.dataset.outlineAt = String(node.item.at);
      button.title = `${node.item.label} (line ${node.item.line})`;

      const badge = document.createElement('span');
      badge.className = 'outline-level-badge';
      badge.textContent = levelNames[node.item.level] ?? 'Sec';

      const label = document.createElement('span');
      label.className = 'outline-label';
      label.textContent = node.item.label;

      button.append(badge, label);
      button.onclick = () => this.jump(file, text, node.item.at);
      row.append(button);
      nodeEl.append(row);

      if (node.children.length > 0) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'outline-children';
        for (const child of node.children) {
          renderNode(child, childrenDiv);
        }
        nodeEl.append(childrenDiv);
      }

      container.append(nodeEl);
    };

    for (const root of roots) {
      renderNode(root, this.outline);
    }

    if (!sectionEntries.length) {
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
        summary.ondragover = (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
          summary.classList.add('drag-hover');
        };
        summary.ondragleave = (e: DragEvent) => {
          if (!summary.contains(e.relatedTarget as Node)) {
            summary.classList.remove('drag-hover');
          }
        };
        summary.ondrop = async (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          summary.classList.remove('drag-hover');
          const internal = e.dataTransfer?.getData('application/x-texquisite-path') || e.dataTransfer?.getData('text/plain');
          if (internal && internal !== folder) {
            try {
              await this.call('moveEntry', internal, folder);
              void this.refresh();
              return;
            } catch (err: any) {
              alert(err?.message || String(err));
              return;
            }
          }
          const files = Array.from(e.dataTransfer?.files ?? []);
          const desktop = (window as any).desktop;
          const filePaths: string[] = [];
          for (const f of files) {
            const p = desktop?.getPathForFile ? desktop.getPathForFile(f) : (f as any).path;
            if (p) filePaths.push(p);
          }
          if (filePaths.length) {
            await this.call('copyFiles', folder, filePaths);
            void this.refresh();
          }
        };

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
          summary.ondragover = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
            summary.classList.add('drag-hover');
          };
          summary.ondragleave = (e: DragEvent) => {
            if (!summary.contains(e.relatedTarget as Node)) {
              summary.classList.remove('drag-hover');
            }
          };
          summary.ondrop = async (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            summary.classList.remove('drag-hover');
            const internal = e.dataTransfer?.getData('application/x-texquisite-path') || e.dataTransfer?.getData('text/plain');
            if (internal && internal !== entry.path) {
              try {
                await this.call('moveEntry', internal, entry.path);
                void this.refresh();
                return;
              } catch (err: any) {
                alert(err?.message || String(err));
                return;
              }
            }
            const files = Array.from(e.dataTransfer?.files ?? []);
            const desktop = (window as any).desktop;
            const filePaths: string[] = [];
            for (const f of files) {
              const p = desktop?.getPathForFile ? desktop.getPathForFile(f) : (f as any).path;
              if (p) filePaths.push(p);
            }
            if (filePaths.length) {
              await this.call('copyFiles', entry.path, filePaths);
              void this.refresh();
            }
          };

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
          item.draggable = true;
          item.ondragstart = (e: DragEvent) => {
            if (e.dataTransfer) {
              e.dataTransfer.setData('text/plain', entry.path);
              e.dataTransfer.setData('application/x-texquisite-path', entry.path);
              e.dataTransfer.effectAllowed = 'copyMove';
            }
            item.classList.add('tree-dragging');
          };
          item.ondragend = () => {
            item.classList.remove('tree-dragging');
          };

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
