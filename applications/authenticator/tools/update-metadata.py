import os
import sys
import json
import hashlib
from datetime import datetime, timezone

script_dir = os.path.dirname(os.path.realpath(__file__))
project_root = os.path.dirname(script_dir)
platform = sys.argv[1]
channel = sys.argv[2]
version = sys.argv[3]
out_dir = os.path.join("authenticator", platform)
dl_base = f"https://proton.me/download/authenticator/{platform}"


def rust_platform():
    match platform:
        case "windows":
            return "windows-x86_64"
        case "linux":
            return "linux-x86_64"


def sha512sum(filename):
    h = hashlib.sha512()
    with open(filename, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()

def to_release_file(file):
    name = file['Name']
    dl_base = f"https://proton.me/download/authenticator/{platform}"
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
    '''
    Generate metadata entry (new_release)
    '''
    files = []

    if platform == "windows":
        files.append({
            'Name': f"ProtonAuthenticator_{version}_x64_en-US.msi",
            'Dir': os.path.join(project_root, 'src-tauri', 'target', 'release', 'bundle', 'msi')
        })
    elif platform == "macos":
        files.append({
            'Name': f"ProtonAuthenticator_{version}_aarch64.dmg",
            'Dir': os.path.join(project_root, 'src-tauri', 'target', 'release', 'bundle', 'dmg')
        })
    elif platform == "linux":
        files.append({
            'Name': f"ProtonAuthenticator_{version}_amd64.deb",
            'Identifier': '.deb (Ubuntu/Debian)',
            'Dir': os.path.join(project_root, 'src-tauri', 'target', 'release', 'bundle', 'deb')
        })
        files.append({
            'Name': f"ProtonAuthenticator-{version}-1.x86_64.rpm",
            'Identifier': '.rpm (Fedora/RHEL)',
            'Dir': os.path.join(project_root, 'src-tauri', 'target', 'release', 'bundle', 'rpm')
        })
        '''
        files.append({
            'Name': f"ProtonAuthenticator_{version}_amd64.AppImage",
            'Identifier': '.AppImage (universal)',
            'Dir': os.path.join(project_root, 'src-tauri', 'target', 'release', 'bundle', 'appimage')
        })
        '''

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    new_release = {
        "CategoryName": channel,
        "Version": version,
        "ReleaseDate": now,
        "RolloutPercentage": 0.05,
        "File": list(map(to_release_file, files))
    }

    '''
    Write an updated version.json with prepended new_release entry
    '''
    version_json_path = os.path.join(out_dir, "version.json")
    if not os.path.isfile(version_json_path):
        version_json = {"Releases": []}
    else:
        with open(version_json_path) as f:
            version_json = json.load(f)
    version_json["Releases"].insert(0, new_release)
    with open(version_json_path, "w") as f:
        print(f"*** Prepending {new_release}")
        json.dump(version_json, f, indent=2)
        f.write("\n")

    """
    Write an updated latest.json
    """
    latest_json_path = os.path.join(out_dir, "latest.json")
    platform_release = None
    if platform == "windows":
        sig_file = os.path.join(
            project_root,
            "src-tauri",
            "target",
            "release",
            "bundle",
            "msi",
            f"ProtonAuthenticator_{version}_x64_en-US.msi.sig",
        )
        with open(sig_file, "r") as f:
            platform_release = {
                "signature": f.read(),
                "url": f"{dl_base}/ProtonAuthenticator_{version}_x64_en-US.msi",
            }
    elif platform == "linux":
        sig_file = os.path.join(
            project_root,
            "src-tauri",
            "target",
            "release",
            "bundle",
            "appimage",
            f"ProtonAuthenticator_{version}_amd64.AppImage.sig",
        )
        with open(sig_file, "r") as f:
            platform_release = {
                "signature": f.read(),
                "url": f"{dl_base}/ProtonAuthenticator_{version}_amd64.AppImage",
            }

    if platform_release is not None:
        latest_release = {
            "version": version,
            "platforms": {
                rust_platform(): platform_release,
            },
        }
        with open(latest_json_path, "w") as f:
            print(f"*** Latest release {latest_release}")
            json.dump(latest_release, f, indent=2)
            f.write("\n")


if __name__ == "__main__":
    main()
