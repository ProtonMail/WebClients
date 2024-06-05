#!/bin/bash
set -e

script_dir=$(dirname "${BASH_SOURCE[0]}")

# Try different paths to find the Python interpreter
python_path=$(command -v python || command -v python3 || command -v /usr/bin/env python)
extension_version=$("$python_path" "$script_dir/get-extension-version.py")

# Match the catalyst app'sv version with the extension's version
echo "Extension version is $extension_version. Matching catalyst app's version..."
bundle exec fastlane bump_version version:"$extension_version"