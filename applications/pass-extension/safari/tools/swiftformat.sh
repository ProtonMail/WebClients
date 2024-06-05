#!/bin/bash

PATH=/opt/homebrew/bin/:$PATH

if which swiftformat >/dev/null; then
  swiftformat .
else
  echo "warning: SwiftFormat not installed, download from https://github.com/nicklockwood/SwiftFormat"
fi