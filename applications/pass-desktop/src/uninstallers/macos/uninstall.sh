#!/bin/sh

set -euo pipefail

CHOICE=`osascript <<EOF
button returned of (display dialog "This action will uninstall Proton Pass and remove associated data. Are you sure you want to continue?" buttons {"Cancel", "Uninstall"} default button 2 with icon caution with title "Proton Pass Uninstall")
EOF`

if [[ "$CHOICE" == "Uninstall" ]]
then
  osascript -e 'quit app "Proton Pass"'

  rm -rf $HOME/Library/Application\ Support/Proton\ Pass/
  rm -rf $HOME/Library/Logs/Proton\ Pass/
  rm -rf /Applications/Proton\ Pass.app
  rm -rf /Applications/Proton\ Pass\ Beta.app


  osascript <<EOF
  display dialog "Proton Pass successfully uninstalled." buttons {"Quit"} default button 1 with title "Proton Pass Uninstall"
EOF
fi
