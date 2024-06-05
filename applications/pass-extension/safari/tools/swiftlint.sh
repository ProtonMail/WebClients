#!/bin/bash

# Common SwiftLint run script for all projects

# Adds support for Apple Silicon brew directory
export PATH="$PATH:/opt/homebrew/bin"

if which swiftlint >/dev/null; then
  swiftlint
else
  echo "warning: SwiftLint not installed, download from https://github.com/realm/SwiftLint"
fi
