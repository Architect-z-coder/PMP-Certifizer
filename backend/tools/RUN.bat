@echo off
cd /d "C:\Parcours de PMP-SMA\PMP\certifizer\PMP-Certifizer"
set FAKE_AUTHOR=
set AUTHOR_MODEL=claude-sonnet-5
set AUDITOR_MODEL=claude-opus-5
set MAX_ITEMS=10
set MAX_BATCHES=6
set MAX_USD=2
if exist backend\tools\anthropic_key.txt goto a_ok
echo Paste your ANTHROPIC API key (sk-ant-...) and press Enter:
set /p KEY=
echo %KEY%> backend\tools\anthropic_key.txt
:a_ok
set /p ANTHROPIC_API_KEY=<backend\tools\anthropic_key.txt
echo Running production (author %AUTHOR_MODEL%, auditor %AUDITOR_MODEL%)...
python backend\tools\produce.py
echo.
echo ---- done. Lots in backend\tools\bank\lots ----
pause
