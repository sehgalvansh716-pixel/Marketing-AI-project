@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        CoolBreeze Image Automation Importer
echo ========================================================
echo.
echo This script will import your cooler images (1.jpg to 10.jpg)
echo from a source folder into the website's 'images' folder.
echo.

:: Prompt for the source directory
set /p "source_dir=Enter the FULL PATH to the folder containing your 10 images (e.g. C:\Users\sehga\Downloads\coolers): "

:: Remove quotes if accidentally added by user
set "source_dir=%source_dir:"=%"

:: Validate if the directory exists
if not exist "%source_dir%" (
    echo [ERROR] The folder "%source_dir%" does not exist. Please check the path and try again.
    pause
    exit /b
)

:: Create the target images directory if it doesn't exist
set "target_dir=%~dp0images"
if not exist "%target_dir%" (
    mkdir "%target_dir%"
    echo [INFO] Created 'images' folder.
)

echo.
echo Importing images...
echo.

:: Loop from 1 to 10 and try to copy extensions jpg, png, or jpeg
set "success_count=0"

for /L %%i in (1,1,10) do (
    set "copied=0"
    
    :: Check typical extensions
    for %%x in (jpg png jpeg webp) do (
        if exist "%source_dir%\%%i.%%x" (
            copy /Y "%source_dir%\%%i.%%x" "%target_dir%\%%i.%%x" >nul
            echo [SUCCESS] Copied %%i.%%x
            set "copied=1"
            set /a "success_count+=1"
            goto extension_found
        )
    )
    
    :extension_found
    if "!copied!"=="0" (
        echo [WARNING] Could not find image %%i with standard extensions in source folder.
    )
)

echo.
echo ========================================================
echo Import complete! Successfully copied !success_count! / 10 images.
echo You can now run 'run.bat' to view the website.
echo ========================================================
pause
