import json
import sys
import os

# Get the directory path of the currently executing script
script_dir = os.path.dirname(os.path.realpath(__file__))

# Construct the path to the manifest file
manifest_path = os.path.join(script_dir, '../../dist/manifest.json')

try:
    with open(manifest_path, 'r') as file:
        manifest = json.load(file)

    version = manifest.get("version")

    if version is None:
        print("Version not found in the manifest.")
        sys.exit(1)

    print(version)
    sys.exit(0)

except FileNotFoundError:
    print(f"File not found: {manifest_path}")
    sys.exit(1)

except json.JSONDecodeError:
    print(f"Error decoding JSON from file: {manifest_path}")
    sys.exit(1)

except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)