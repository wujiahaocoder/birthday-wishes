@echo off
chcp 65001 >nul
title 今日偏爱 - 生日祝福
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 24 或更高版本，再打开本文件。
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo 首次使用请在项目目录运行 npm install。
  pause
  exit /b 1
)
echo 正在打开生日祝福页面。请保留此窗口，关闭后本地服务会停止。
node scripts/launch-local.mjs
if errorlevel 1 pause
