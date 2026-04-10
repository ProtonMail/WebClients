#!/bin/bash
set -e

script_dir=$(dirname "${BASH_SOURCE[0]}")

# Try different paths to find the Python interpreter
python_path=$(command -v python || command -v python3 || command -v /usr/bin/env python)
app_version=$("$python_path" "$script_dir/get-app-version.py")

# Match the extension app's version with the app's version
echo "App version is $app_version. Matching extension's version..."
VERSION=$app_version bundle exec fastlane bump_version