# 🚀 Local Node.js Setup Guide

**Status**: Company policy prevents system-wide installations  
**Solution**: Portable Node.js in project folder

---

## Quick Start (3 Steps)

### Step 1: Download Node.js Binary

1. Visit **https://nodejs.org/download**
2. Download the **Windows Binary** (not installer):
   - Look for: `node-v20.x.x-win-x64.zip`
   - Or latest LTS version available
3. Extract to: `c:\Data\Portfolio\node_portable\`

Result:
```
c:\Data\Portfolio\
├── node_portable/
│   ├── node.exe
│   ├── npm
│   ├── npm.cmd
│   └── (other files)
```

### Step 2: Verify Installation

**Option A: Using PowerShell (Recommended)**
```powershell
# Navigate to project folder
cd c:\Data\Portfolio

# Run the setup script
.\setup-local-node.ps1

# Verify
node --version
npm --version
```

**Option B: Using Command Prompt**
```cmd
# Navigate to project folder
cd c:\Data\Portfolio

# Direct command
node_portable\node.exe --version
node_portable\npm.cmd --version
```

### Step 3: Run Project Commands

**Using the wrapper scripts:**
```cmd
# If you're in the project folder:
npm install
npm run dev
npm run build
```

**Or with full path:**
```cmd
c:\Data\Portfolio\node_portable\npm.cmd install
c:\Data\Portfolio\node_portable\npm.cmd run dev
```

---

## ✅ Verification Checklist

After downloading Node.js binary:

- [ ] Extract `node-v*.zip` to `c:\Data\Portfolio\node_portable\`
- [ ] Verify `node_portable\node.exe` exists
- [ ] Verify `node_portable\npm.cmd` exists
- [ ] Run: `node_portable\node.exe --version` (shows version)
- [ ] Run: `node_portable\npm.cmd --version` (shows version)
- [ ] Run from project folder: `npm install` (installs packages)
- [ ] Run: `npm run dev` (starts development server)

---

## Usage Examples

### PowerShell (Easiest)

```powershell
# First time only: activate local Node.js
.\setup-local-node.ps1

# Then use normally
node --version
npm --version
npm install
npm run dev

# All commands work like system-wide Node.js
npm start
npm run build
npm test
```

### Command Prompt (Direct)

```cmd
# Use with full path
node_portable\node.exe --version
node_portable\npm.cmd --version
node_portable\npm.cmd install
node_portable\npm.cmd run dev
```

### Using Batch Wrappers

If you created `npm.bat` and `node.bat`:

```cmd
# Add project folder to PATH (temporary, this session only)
set PATH=%cd%;%PATH%

# Then use npm and node directly
npm --version
npm install
npm run dev
```

---

## 📦 Installing Dependencies

After Node.js is set up:

```powershell
# Activate local Node.js
.\setup-local-node.ps1

# Install project dependencies
npm install

# This creates node_modules/ folder locally
```

Your project structure will become:
```
c:\Data\Portfolio\
├── node_portable/        ← Portable Node.js
├── node_modules/         ← Project dependencies
├── src/                  ← Your code
├── package.json          ← Dependencies list
├── npm.bat              ← Wrapper script
├── node.bat             ← Wrapper script
├── setup-local-node.ps1 ← Setup script
└── (other files)
```

---

## 🚀 Running the Project

### Development Server

```powershell
# First time in a new session: activate local Node.js
.\setup-local-node.ps1

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```powershell
# Activate local Node.js
.\setup-local-node.ps1

# Build
npm run build

# Production server
npm start
```

---

## 🔧 Troubleshooting

### "node_portable\node.exe not found"
- **Issue**: Node.js not extracted to correct location
- **Fix**: Verify `c:\Data\Portfolio\node_portable\node.exe` exists

### "npm: command not found"
- **Issue**: PATH not set correctly
- **Fix**: Run `.\setup-local-node.ps1` first (PowerShell)

### "'npm' is not recognized"
- **Issue**: Using full path incorrectly
- **Fix**: Use `node_portable\npm.cmd install` (not just `npm`)

### "Permission denied"
- **Issue**: PowerShell execution policy
- **Fix**: 
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### npm install is slow
- **Issue**: First installation always takes time
- **Fix**: This is normal, wait for completion (~5-10 min)

---

## 📋 Project Dependencies

After `npm install`, you'll have:

```
✅ React 19
✅ Next.js 15
✅ TypeScript
✅ Tailwind CSS
✅ PostgreSQL driver (pg)
✅ bcryptjs (password hashing)
✅ jsonwebtoken (JWT tokens)
✅ date-fns (date manipulation)
✅ js-cookie (browser cookies)
```

All installed locally in `node_modules/` folder.

---

## 🌐 Environment Variables

Create `.env.local` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bike_reservation

# JWT Secret
JWT_SECRET=your-super-secret-key-change-this

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## ✨ Next Steps

1. **Download Node.js Binary**
   - Go to nodejs.org/download
   - Download Windows Binary version
   - Extract to `node_portable/`

2. **Install Dependencies**
   ```powershell
   .\setup-local-node.ps1
   npm install
   ```

3. **Setup Database** (see QUICKSTART.md)
   - Create PostgreSQL database
   - Load schema: `psql bike_reservation < db/schema.sql`

4. **Create Environment File**
   - Copy `.env.example` to `.env.local`
   - Update DATABASE_URL and JWT_SECRET

5. **Run Development Server**
   ```powershell
   .\setup-local-node.ps1
   npm run dev
   ```

6. **Access Application**
   - Volunteer Portal: http://localhost:3000/volunteer
   - Admin Portal: http://localhost:3000/admin

---

## 🎯 Benefits of Portable Node.js

✅ **No system-wide changes** - Works with company policy  
✅ **Self-contained** - Everything in project folder  
✅ **Easy to backup** - Just copy the folder  
✅ **Easy to share** - Give folder to teammates  
✅ **Easy to delete** - Just delete the folder  
✅ **Multiple versions** - Different Node.js per project  
✅ **No admin rights needed** - User-level permissions only  

---

## 📞 Support

**If npm install fails:**
- Check internet connection
- Check Node.js version compatibility
- Try: `npm cache clean --force`
- Try: Delete `node_modules/` and `package-lock.json`, then reinstall

**If commands don't work:**
- Verify Node.js extracted correctly
- Verify you're in project folder (`c:\Data\Portfolio`)
- Try full path: `node_portable\npm.cmd install`
- Run PowerShell as regular user (not admin)

---

**Status**: ✅ Ready to use  
**Tested**: Windows 10/11  
**Node.js Version**: Latest LTS (currently 20.x)  
**npm Version**: Included with Node.js  

🎉 **Your portable Node.js is ready!**
