@echo off
title VIP Community Premium Security
if not exist node_modules call npm install
if not exist .env (
 echo Rename .env.example to .env and add your Bot Token.
 pause
 exit /b
)
npm start
pause
