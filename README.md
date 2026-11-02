# TeXquisite for macOS (Apple Silicon & Intel)
### Modern, Persistent, BaKoMa-Style Live LaTeX Editor

**TeXquisite** is a high-performance standalone LaTeX editor designed for real-time document authoring. It combines a resident WebAssembly compiler engine with native TeX Live toolchains to deliver **instant live previews (<15ms latency)** as you type—bringing the legendary BaKoMa TeX workflow to modern macOS with zero compromise on typography or compilation accuracy.

---

## Key Highlights

- **Instant Live Preview (BaKoMa Style)**: Type code and see your equations, paragraphs, and sections render instantaneously without triggering a full, slow recompile on every keystroke.
- **Continuous Scroll & Smooth Zoom**: Fluid trackpad pinch-to-zoom, mouse-wheel zoom, and continuous multi-page scrolling with retina-crisp vector rendering.
- **Word-Level SyncTeX Navigation**: Double-click anywhere in the PDF preview to jump directly to the exact word and character in source code, or click in the editor to locate the rendered text.
- **Never-Blank Document Verification**: If you introduce a LaTeX syntax error while drafting, TeXquisite never destroys or blanks your preview. It smoothly preserves your last good compiled state and highlights the exact error line.
- **Smart Tab & Window Management**:
  - `Cmd + W`: Closes the active document tab (with tab close button `×`).
  - `Cmd + Shift + W`: Closes the editor window.
  - `Cmd + Q`: Quits the application.
- **Overleaf-Style Modern UI**:
  - Clean Find & Replace overlay dialog (`Cmd + F`, `Esc` to close).
  - Smart autocomplete for `\usepackage{...}`, `\cite{...}`, math symbols (`\alpha`, `\beta`, `\int`, `\sum`), and environments.
  - New `.tex` files automatically initialize with standard A4 paper, geometry, and AMS-math boilerplate.
  - Full project folder sidebar for managing multi-file books, theses, and papers.

---

## Installation on macOS

### 1. Download & Install
1. Open the included **`TeXquisite-0.122.0-arm64.dmg`**.
2. Drag **`TeXquisite.app`** into your **`Applications`** folder.

> **Note on macOS Gatekeeper**: Because this build is distributed outside the Apple App Store, macOS may show a prompt: *"TeXquisite cannot be opened because the developer cannot be verified"*.
> - Simply **Right-click (or Control-click)** on `TeXquisite.app` in `/Applications` and select **Open**, then click **Open**.
> - Alternatively, open Terminal and run:
>   ```bash
>   xattr -cr /Applications/TeXquisite.app
>   ```

### 2. TeX Distribution Requirement
TeXquisite uses standard TeX tools installed on your Mac:
- Ensure **MacTeX** or **TeX Live** is installed (`pdflatex`, `latexmk`, `kpsewhich`).
- If you don't have TeX Live yet, install it via Homebrew:
  ```bash
  brew install --cask mactex-no-gui
  ```
  or download MacTeX from [tug.org/mactex](https://www.tug.org/mactex/).

### 3. First-Run Quick Setup (Enabling Fast Format)
1. Launch **TeXquisite**.
2. Open **TeXquisite Menu** -> **Preferences / Build Settings…** (`Cmd + ,`).
3. Verify that your TeX Live installation folder is recognized (typically `/Library/TeX/texbin` or `/usr/local/texlive/...`).
4. Click **Prepare Fast Format**. This pre-caches the macro packages into the resident engine, unlocking sub-15ms live typing!

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd + W` | Close current tab |
| `Cmd + Shift + W` | Close window |
| `Cmd + Q` | Quit TeXquisite |
| `Cmd + S` | Save active file |
| `Cmd + B` | Force full document build & verification |
| `Cmd + O` | Open file |
| `Cmd + Shift + E` | Export verified full PDF |
| `Cmd + F` | Find & Replace in current document (`Esc` to dismiss) |
| `Cmd + Shift + F` | Project-wide Find & Replace across all project files |
| `Cmd + Enter` | Synchronize preview to cursor position |
| `Cmd + ,` | Preferences & Build Settings |
| `Alt + M` | Insert inline math `$...$` |
| `Alt + D` | Insert display math `\[ ... \]` |

---

## Building from Source

If you want to modify or compile TeXquisite yourself using the included `TeXquisite-source.zip`:

```bash
# 1. Unzip the source code
unzip TeXquisite-source.zip -d TeXquisite
cd TeXquisite

# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Run tests
npm test

# 5. Launch development build
npm start

# 6. Package a new macOS DMG installer
npm run package:mac:dist
```

---

## License

TeXquisite is free software licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
Based on SwiftLaTeX / Persistent TeX research.
