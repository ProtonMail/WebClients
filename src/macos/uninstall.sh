#!/bin/sh

CHOICE=`osascript <<EOF
button returned of (display dialog "This action will uninstall Proton Mail and remove associated data. Are you sure you want to continue?" buttons {"Cancel", "Uninstall"} default button 2 with icon caution with title "Proton Mail Uninstall")
EOF`

if [[ "$CHOICE" == "Uninstall" ]]
then
  osascript -e 'quit app "Proton Mail"'

  rm -rf $HOME/Library/Application\ Support/Proton\ Mail/
  rm -rf $HOME/Library/Logs/Proton\ Mail/
  rm -rf /Applications/Proton\ Mail.app
  rm -rf /Applications/Proton\ Mail\ Beta.app

  rm -rf Applications/Proton\ Mail\ Uninstaller.app
  
  osascript <<EOF
  display dialog "Proton Mail successfully uninstalled." buttons {"Quit"} default button 1 with title "Proton Mail Uninstall"
EOF
fi