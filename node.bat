@echo off
REM Local node wrapper - uses portable Node.js in node_portable folder
setlocal enabledelayedexpansion

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Set NODE_PATH to the portable Node.js folder
set NODE_PATH=%SCRIPT_DIR%node_portable

REM Run node with the local Node.js
"%NODE_PATH%\node.exe" %*

endlocal
