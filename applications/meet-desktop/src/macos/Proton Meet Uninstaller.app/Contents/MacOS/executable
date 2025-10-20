#!/bin/sh

CHOICE=`osascript <<EOF
button returned of (display dialog "This action will uninstall Proton Meet and remove associated data. Are you sure you want to continue?" buttons {"Cancel", "Uninstall"} default button 2 with icon caution with title "Proton Meet Uninstall")
EOF`

if [[ "$CHOICE" == "Uninstall" ]]
then
  osascript -e 'quit app "Proton Meet"'

  rm -rf $HOME/Library/Application\ Support/Proton\ Meet/
  rm -rf $HOME/Library/Logs/Proton\ Meet/
  rm -rf /Applications/Proton\ Meet.app

  rm -rf Applications/Proton\ Meet\ Uninstaller.app
  
  osascript <<EOF
  display dialog "Proton Meet successfully uninstalled." buttons {"Quit"} default button 1 with title "Proton Meet Uninstall"
EOF
fi