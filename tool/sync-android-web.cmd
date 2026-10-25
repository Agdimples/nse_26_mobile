@echo off
REM Sync the built SPA (dist-android/client) into the Android assets ROOT.
REM
REM IMPORTANT: files go directly into android/app/src/main/assets (NOT a
REM subfolder). FullOfflineActivity registers AssetsPathHandler at "/assets/",
REM which maps URL https://appassets.androidplatform.net/assets/* onto the
REM assets root. The Vite build (base "/assets/") already emits index.html at
REM its root and hashed chunks under assets/, so URL /assets/index.html ->
REM AssetManager "index.html" and /assets/assets/index-xxx.js ->
REM AssetManager "assets/index-xxx.js". Copying into a subfolder (like
REM assets/web) breaks every lookup with net::ERR_INVALID_RESPONSE.
REM Run from repo root AFTER `npx vite build --config vite.config.android.ts`.
setlocal
set SRC=dist-android\client
set DST=android\app\src\main\assets

if not exist "%SRC%\index.html" (
  echo ERROR: %SRC%\index.html not found - run the SPA build first:
  echo   npx vite build --config vite.config.android.ts
  exit /b 1
)

REM Remove any previous bundle copy, including the wrong assets/web layout.
if exist "%DST%\web" rmdir /s /q "%DST%\web"
if exist "%DST%\assets" rmdir /s /q "%DST%\assets"
if exist "%DST%\index.html" del /q "%DST%\index.html"

xcopy "%SRC%\*" "%DST%\" /e /i /q >nul
echo Synced %SRC% -^> %DST% (assets root)
endlocal
