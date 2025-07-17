@echo off
echo Searching for Java installations...
echo.

:: Check common Java installation locations
echo Checking common installation paths:

if exist "C:\Program Files\Eclipse Adoptium" (
  echo Found: C:\Program Files\Eclipse Adoptium
  dir "C:\Program Files\Eclipse Adoptium"
) else (
  echo Not found: C:\Program Files\Eclipse Adoptium
)

if exist "C:\Program Files\Java" (
  echo Found: C:\Program Files\Java
  dir "C:\Program Files\Java"
) else (
  echo Not found: C:\Program Files\Java
)

if exist "C:\Program Files\AdoptOpenJDK" (
  echo Found: C:\Program Files\AdoptOpenJDK
  dir "C:\Program Files\AdoptOpenJDK"
) else (
  echo Not found: C:\Program Files\AdoptOpenJDK
)

echo.
echo Current environment variables:
echo JAVA_HOME=%JAVA_HOME%
echo PATH=%PATH%

echo.
echo Java version:
java -version

echo.
echo Press any key to exit...
pause > nul
