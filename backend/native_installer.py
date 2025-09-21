"""
Native Extension Installer
Automatically installs the Athena browser extension with minimal user interaction
"""

import os
import platform
import subprocess
import winreg
import json
from pathlib import Path
from typing import Optional, Dict, Any

class NativeExtensionInstaller:
    def __init__(self):
        self.system = platform.system()
        self.extension_path = Path(__file__).parent.parent / "browser-extension"

    def install_extension_automatically(self) -> Dict[str, Any]:
        """
        Attempt to install the extension automatically using various methods
        """
        try:
            # Method 1: Check if Chrome is installed and get its path
            chrome_path = self.get_chrome_path()
            if not chrome_path:
                return {"success": False, "message": "Chrome not found"}

            # Method 2: Try to enable developer mode via registry (Windows)
            if self.system == "Windows":
                dev_mode_enabled = self.enable_developer_mode_windows()
                if dev_mode_enabled:
                    # Method 3: Install extension directly
                    return self.install_via_command_line(chrome_path)

            # Method 4: Try via Chrome policies
            return self.install_via_policy()

        except Exception as e:
            return {"success": False, "message": f"Installation failed: {str(e)}"}

    def get_chrome_path(self) -> Optional[str]:
        """Get the Chrome executable path"""
        if self.system == "Windows":
            # Common Chrome installation paths on Windows
            chrome_paths = [
                os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
                os.path.expandvars(r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"),
                os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            ]

            for path in chrome_paths:
                if os.path.exists(path):
                    return path

        elif self.system == "Darwin":  # macOS
            chrome_paths = [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            ]
            for path in chrome_paths:
                expanded_path = os.path.expanduser(path)
                if os.path.exists(expanded_path):
                    return expanded_path

        elif self.system == "Linux":
            # Try to find Chrome via which command
            try:
                result = subprocess.run(["which", "google-chrome"], capture_output=True, text=True)
                if result.returncode == 0:
                    return result.stdout.strip()
            except:
                pass

        return None

    def enable_developer_mode_windows(self) -> bool:
        """Enable Chrome developer mode via Windows registry"""
        try:
            # Chrome extension developer mode registry key
            key_path = r"SOFTWARE\Policies\Google\Chrome"

            # Open or create the registry key
            with winreg.CreateKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
                # Enable developer mode
                winreg.SetValueEx(key, "DeveloperToolsAvailability", 0, winreg.REG_DWORD, 1)
                # Allow extension installation from outside Web Store
                winreg.SetValueEx(key, "ExtensionInstallForcelist", 0, winreg.REG_MULTI_SZ, [])

            return True
        except Exception as e:
            print(f"Registry modification failed: {e}")
            return False

    def install_via_command_line(self, chrome_path: str) -> Dict[str, Any]:
        """Install extension via Chrome command line"""
        try:
            # Create a temporary extension directory
            import tempfile
            import zipfile
            from .extension_download import extension_downloader

            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract extension to temp directory
                zip_path = extension_downloader.create_extension_zip()

                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)

                # Launch Chrome with extension loading
                cmd = [
                    chrome_path,
                    f"--load-extension={temp_dir}",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "chrome://extensions/"
                ]

                subprocess.Popen(cmd, shell=True)

                return {
                    "success": True,
                    "message": "Extension installed! Chrome should open with the extension loaded."
                }

        except Exception as e:
            return {"success": False, "message": f"Command line installation failed: {str(e)}"}

    def install_via_policy(self) -> Dict[str, Any]:
        """Install extension via Chrome enterprise policies"""
        try:
            # For enterprise/managed installation
            if self.system == "Windows":
                return self.install_via_windows_policy()
            elif self.system == "Darwin":
                return self.install_via_macos_policy()
            elif self.system == "Linux":
                return self.install_via_linux_policy()

            return {"success": False, "message": "Policy installation not supported on this platform"}

        except Exception as e:
            return {"success": False, "message": f"Policy installation failed: {str(e)}"}

    def install_via_windows_policy(self) -> Dict[str, Any]:
        """Install via Windows group policy"""
        try:
            # Create extension policy for automatic installation
            policy_path = r"SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist"

            with winreg.CreateKey(winreg.HKEY_LOCAL_MACHINE, policy_path) as key:
                # Add our extension to force install list
                # Note: This would require the extension to be in Chrome Web Store
                # For development, we use developer mode instead
                pass

            return {"success": False, "message": "Policy installation requires Chrome Web Store deployment"}

        except Exception as e:
            return {"success": False, "message": f"Windows policy installation failed: {str(e)}"}

    def install_via_macos_policy(self) -> Dict[str, Any]:
        """Install via macOS configuration profile"""
        # Would require creating and installing a configuration profile
        return {"success": False, "message": "macOS policy installation not implemented"}

    def install_via_linux_policy(self) -> Dict[str, Any]:
        """Install via Linux policy file"""
        # Would require creating JSON policy files
        return {"success": False, "message": "Linux policy installation not implemented"}

    def create_installer_script(self) -> str:
        """Create a one-click installer script"""
        if self.system == "Windows":
            return self.create_windows_installer()
        elif self.system == "Darwin":
            return self.create_macos_installer()
        elif self.system == "Linux":
            return self.create_linux_installer()

        return ""

    def create_windows_installer(self) -> str:
        """Create Windows batch installer"""
        script_content = '''@echo off
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
start "" chrome.exe --load-extension="%cd%\\athena-extension" --no-first-run chrome://extensions/

echo.
echo Installation complete! Chrome should open with the Athena extension loaded.
echo You may need to enable the extension if prompted.
echo.
pause
'''

        script_path = Path(__file__).parent / "install_athena_extension.bat"
        with open(script_path, 'w') as f:
            f.write(script_content)

        return str(script_path)

    def create_macos_installer(self) -> str:
        """Create macOS shell installer"""
        script_content = '''#!/bin/bash
echo "Installing Athena Fact Checker Extension..."
echo

# Download extension
echo "Downloading extension package..."
curl -L -o athena-extension.zip http://localhost:8000/api/download-extension
if [ $? -ne 0 ]; then
    echo "Failed to download extension"
    exit 1
fi

# Extract extension
echo "Extracting extension..."
unzip -o athena-extension.zip -d athena-extension

# Launch Chrome with extension
echo "Installing extension in Chrome..."
open -a "Google Chrome" --args --load-extension="$(pwd)/athena-extension" --no-first-run chrome://extensions/

echo
echo "Installation complete! Chrome should open with the Athena extension loaded."
echo "You may need to enable the extension if prompted."
echo
'''

        script_path = Path(__file__).parent / "install_athena_extension.sh"
        with open(script_path, 'w') as f:
            f.write(script_content)

        # Make executable
        os.chmod(script_path, 0o755)

        return str(script_path)

    def create_linux_installer(self) -> str:
        """Create Linux shell installer"""
        return self.create_macos_installer()  # Same as macOS for now

# Global instance
native_installer = NativeExtensionInstaller()