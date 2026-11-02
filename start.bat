@echo off
echo ========================================
echo    KHOI DONG HE THONG KLTN CLINIC
echo ========================================
echo.

echo [1/2] Khoi dong Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo [2/2] Khoi dong Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   HE THONG DANG KHOI DONG!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Doi 10-15 giay de he thong khoi dong...
echo.
pause
