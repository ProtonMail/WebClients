@ECHO OFF
ECHO Killing %1
TASKKILL /PID %1 /T
ECHO Removing %2
DEL /S /Q %2
RMDIR /S /Q %2
ECHO Removing %3
DEL /S /Q %3
RMDIR /S /Q %3
ECHO Removing uninstall script
DEL /S /Q %4
