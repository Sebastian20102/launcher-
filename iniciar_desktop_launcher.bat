@echo off
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
    python desktop_launcher.py
) else (
    py -3 desktop_launcher.py
)
