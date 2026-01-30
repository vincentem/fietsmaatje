# 🚀 Portable Node.js Quick Reference

## 3-Step Setup

### 1️⃣ Download Binary
- Visit **https://nodejs.org/download**
- Download: `node-v*-win-x64.zip` (Windows Binary)
- Extract to: `c:\Data\Portfolio\node_portable\`

### 2️⃣ Verify Installation
```powershell
cd c:\Data\Portfolio
.\setup-local-node.ps1
node --version
npm --version
```

### 3️⃣ Install Dependencies
```powershell
npm install
npm run dev
```

---

## Daily Usage

### PowerShell
```powershell
# Activate local Node.js (first time per session)
.\setup-local-node.ps1

# Use npm and node normally
npm install
npm run dev
npm run build
node script.js
```

### Command Prompt
```cmd
# Use full path to npm
node_portable\npm.cmd install
node_portable\npm.cmd run dev

# Or use full path to node
node_portable\node.exe --version
```

---

## Folder Structure

```
c:\Data\Portfolio\
├── node_portable/          ← Download Node.js here
│   ├── node.exe
│   ├── npm
│   ├── npm.cmd
│   └── ...
├── node_modules/           ← Created by: npm install
├── src/                    ← Your code
├── package.json            ← Dependencies
├── .env.local              ← Environment variables
├── setup-local-node.ps1    ← Run this first
├── npm.bat                 ← Optional wrapper
├── node.bat                ← Optional wrapper
└── LOCAL_NODE_SETUP.md     ← Full guide
```

---

## Common Commands

| Task | Command |
|------|---------|
| Check node version | `node --version` |
| Check npm version | `npm --version` |
| Install packages | `npm install` |
| Start dev server | `npm run dev` |
| Build for prod | `npm run build` |
| Run lint | `npm run lint` |
| Clear npm cache | `npm cache clean --force` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Command not found" | Run `.\setup-local-node.ps1` first |
| "node.exe not found" | Verify file in `node_portable/` folder |
| "Permission denied" | Run PowerShell as current user (not admin) |
| "npm install slow" | Normal (5-10 min first time) |

---

## No Installation Required ✅

- No admin rights needed
- No system changes
- Works with company policy
- Easy to remove
- Easy to backup
- Easy to share

---

**Download Node.js Binary** → **Extract** → **Run npm** → **Done!** 🎉
