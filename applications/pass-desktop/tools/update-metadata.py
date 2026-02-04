import hashlib
import json
import os
import sys
from datetime import datetime, timezone

script_dir = os.path.dirname(os.path.realpath(__file__))
project_root = os.path.dirname(script_dir)
platform = sys.argv[1]

def sha512sum(filename):
    h = hashlib.sha512()
    with open(filename, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()

def to_release_file(file):
    name = file['Name']
    dl_base = f"https://proton.me/download/pass/{platform}"
    sha = sha512sum(os.path.join(file['Dir'], name))

    release_file = {
        'Url': f"{dl_base}/{file['Name']}",
        'Sha512CheckSum': sha,
        'Args': '',
    }

    if 'Identifier' in file:
        release_file['Identifier'] = file['Identifier']

    return release_file

def main():
    with open(os.path.join(project_root, "package.json")) as f:
        version = json.load(f)["version"]

    files = []

    if platform == "windows":
        files.append({
            'Name': f"ProtonPass_Setup_{version}.exe",
            'Dir': os.path.join(project_root, 'out', 'make', 'squirrel.windows', 'x64'),
        })
    elif platform == "macos":
        files.append({
            'Name': f"ProtonPass_{version}.dmg",
            'Dir': os.path.join(project_root, 'out', 'make'),
        })
    elif platform == "linux":
        files.append({
            'Name': f"proton-pass_{version}_amd64.deb",
            'Identifier': '.deb (Ubuntu/Debian)',
            'Dir': os.path.join(project_root, 'out', 'make', 'deb', 'x64'),
        })
        files.append({
            'Name': f"proton-pass-{version}-1.x86_64.rpm",
            'Identifier': '.rpm (Fedora/RHEL)',
            'Dir': os.path.join(project_root, 'out', 'make', 'rpm', 'x64'),
        })

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    version_json_path = f"assets/{platform}/version.json"
    if not os.path.isfile(version_json_path):
        with open(version_json_path, "w") as f:
            json.dump({"Releases": []}, f)

    with open(version_json_path) as f:
        version_json = json.load(f)

    new_release = {
        "CategoryName": "Beta",
        "Version": version,
        "ReleaseDate": now,
        "RolloutPercentage": 1, # 100% of beta channel by default
        "File": list(map(to_release_file, files))
    }

    version_json["Releases"].insert(0, new_release)
    with open(version_json_path, "w") as f:
        print(f"*** Prepending {new_release}")
        json.dump(version_json, f, indent=2)
        f.write("\n")

if __name__ == "__main__":
    main()
