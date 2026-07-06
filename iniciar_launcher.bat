@echo off
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
    python pc_launcher.py
) else (
    py -3 pc_launcher.py
)
