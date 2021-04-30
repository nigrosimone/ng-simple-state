@echo off
npm version patch && ^
cd "%cd%\projects\ng-simple-state" && ^
npm version patch && ^
cd "%cd%" && ^
npm run build ng-simple-state --prod && ^
copy /y "%cd%\README.md" "%cd%\dist\ng-simple-state\README.md" && ^
copy /y "%cd%\LICENSE" "%cd%\dist\ng-simple-state\LICENSE" && ^
cd "%cd%\dist\ng-simple-state" && ^
npm publish --ignore-scripts && ^
cd "%cd%"
pause