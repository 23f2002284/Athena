@echo off
echo Installing Athena Fact Checker Extension...
echo.

REM Download extension
echo Downloading extension package...
curl -L -o athena-extension.zip http://localhost:8000/api/download-extension
if errorlevel 1 (
    echo Failed to download extension
    pause
    exit /b 1
)

REM Extract extension
echo Extracting extension...
powershell -command "Expand-Archive -Path athena-extension.zip -DestinationPath athena-extension -Force"

REM Launch Chrome with extension
echo Installing extension in Chrome...
start "" chrome.exe --load-extension="%cd%\athena-extension" --no-first-run chrome://extensions/

echo.
echo Installation complete! Chrome should open with the Athena extension loaded.
echo You may need to enable the extension if prompted.
echo.
pause
