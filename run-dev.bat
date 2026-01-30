@echo off
REM Run dev server using portable Node/npm to avoid PowerShell script policy issues.
SETLOCAL

REM Repository root directory (folder containing this script)
SET "REPO_DIR=%~dp0"
SET "NODE_PORTABLE=%REPO_DIR%node_portable"

REM Ensure portable node is first on PATH for this session
SET "PATH=%NODE_PORTABLE%;%PATH%"

cd /d "%REPO_DIR%"
echo Using npm at "%NODE_PORTABLE%\npm.cmd"

echo Starting dev server...
"%NODE_PORTABLE%\npm.cmd" run dev

set EXITCODE=%ERRORLEVEL%
echo.
echo Dev server exited with code %EXITCODE%.
if %EXITCODE% neq 0 (
	echo There was an error starting the dev server. Check the output above.
)
echo.
pause

ENDLOCAL