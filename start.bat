@echo off
chcp 65001 >nul
echo ========================================
echo  Dolibarr Docker Ba&#351;lat&#305;c&#305;
echo ========================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [HATA] Docker &#231;al&#305;&#351;m&#305;yor! Lutfen Docker Desktop'&#305; a&#231;&#305;n.
    pause
    exit /b 1
)

echo [OK] Docker &#231;al&#305;&#351;&#305;yor
echo.

:: Load environment variables
setlocal enabledelayedexpansion
if exist .env.docker (
    for /f "usebackq tokens=1,2 delims==" %%a in (.env.docker) do (
        set "%%a=%%b"
    )
    echo [OK] .env.docker yuklendi
)

:: Start containers
echo.
echo [BASLANGI&#199;] Container'lar ba&#351;lat&#305;l&#305;yor...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo [HATA] Container baslatilamadi!
    echo Durdurmak icin: docker-compose down
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Dolibarr Ba&#351;lat&#305;ld&#305;
echo ========================================
echo.
echo  Web Arayuz : http://localhost:%DOLIBARR_PORT:-8080%
echo  MySQL Port : %MYSQL_PORT:-3307%
echo.
echo  Giris Bilgileri:
echo  Kullan&#305;c&#305; : admin
echo  Sifre     : %DOLIBARR_ADMIN_PASSWORD:-admin123%
echo.
echo  Durdurmak icin: docker-compose down
echo  Loglari gormek icin: docker-compose logs -f
echo ========================================
echo.
pause
