# How to Fork and Release TeXquisite on GitHub

This guide shows you step-by-step how to:
1. **Fork** the original upstream repository on GitHub so it explicitly displays `forked from complexzeta/TeXquisite`.
2. **Push** all your improvements and fixes to your fork.
3. **Publish a GitHub Release** containing the macOS DMG installer and the source code `.zip` for easy distribution.

---

## Step 1: Create the Fork on GitHub

1. Open your web browser and go to the upstream repository:
   **[https://github.com/complexzeta/TeXquisite](https://github.com/complexzeta/TeXquisite)**
2. In the top-right corner of the page, click the **"Fork"** button.
3. In the dialog that opens:
   - Select your personal GitHub account (or organization) under **Owner**.
   - Repository name: Keep it as `TeXquisite` (or rename if you prefer).
   - Uncheck "Copy the main branch only" if you want all branches, or keep it checked.
   - Click **"Create fork"**.
4. GitHub will create your repository (e.g., `https://github.com/<YOUR-USERNAME>/TeXquisite`).
   Underneath your repository name, GitHub will automatically display:
   > *forked from complexzeta/TeXquisite*

---

## Step 2: Update Local Git Remotes and Push Changes

Open your Terminal and run these commands from the TeXquisite directory:

```bash
cd /Users/anshveerbindra/Downloads/TeXquisite

# 1. Check current remotes
git remote -v

# 2. Point 'origin' to YOUR new fork (replace <YOUR-USERNAME> with your GitHub username)
git remote set-url origin https://github.com/<YOUR-USERNAME>/TeXquisite.git

# 3. Add the original repository as 'upstream' so you can pull future updates if needed
git remote add upstream https://github.com/complexzeta/TeXquisite.git

# 4. Verify your remotes now show origin pointing to your account and upstream to complexzeta:
git remote -v
# origin   https://github.com/<YOUR-USERNAME>/TeXquisite.git (fetch)
# origin   https://github.com/<YOUR-USERNAME>/TeXquisite.git (push)
# upstream https://github.com/complexzeta/TeXquisite.git (fetch)
# upstream https://github.com/complexzeta/TeXquisite.git (push)

# 5. Stage, commit, and push your changes to your fork
git add -A
git commit -m "Add macOS tab close (Cmd+W), continuous scroll fixes, word SyncTeX, and Overleaf-style UI"
git push -u origin main
```

---

## Step 3: Create a GitHub Release for macOS

Now upload the macOS `.dmg` and source `.zip` as downloadable release artifacts so anyone can download and install TeXquisite with one click:

1. On GitHub, navigate to your fork repository: `https://github.com/<YOUR-USERNAME>/TeXquisite`.
2. On the right sidebar, click **"Releases"** (or click **"Create a new release"**).
3. Click **"Draft a new release"**.
4. Fill in the release details:
   - **Choose a tag**: Type `v0.122.0-mac` (and select *Create new tag: v0.122.0-mac on publish*).
   - **Target**: `main`.
   - **Release title**: `TeXquisite v0.122.0 for macOS (Apple Silicon & Intel)`
   - **Description**: Copy and paste the contents of the included `README.md` into the release notes.
5. **Attach Binaries**:
   - Drag and drop the following files from `/Users/anshveerbindra/Downloads/TeXquisite-Distribution-macOS/` into the binaries drop zone:
     1. `TeXquisite-0.122.0-arm64.dmg`
     2. `TeXquisite-source.zip`
6. Click **"Publish release"**.

---

## Done!

Your GitHub fork is now live, linked to the original project, and hosting ready-to-use macOS DMG downloads for distribution!
