# Custom build of Squirrel

If you want to use custom vendor in your project you have to set the path in forge config

```typescript
const config: ForgeConfig = {
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                vendorDirectory: `${__dirname}/../../packages/shared/lib/squirrel/assets`,
            },
        },
    ],
};
```

## Before building

- Installing 2019 version v142 and .NET 4.5
    ```
    choco install visualstudio2019buildtools
    ```
- modify -> add these:
    - Workloads:
        - `Desktop development C++`
        - `.NET desktop build tools`
    - Individual:
        - `.NET SDK (out of support)`
        - `C++ ATL for latest v142 build tools (x86 & x64)`
        - `.NET Framework 3.5 development tools`
- In windows `Sever Manager` we need to add feature `.NET Framework 3.5 features`

## To build

Clone fork https://github.com/ProtonMail/Squirrel.Windows `cd` to project and run

```
.\devbuild.cmd release
```

## Update vendor files

Only these are necessary to change:

```
.rw------- 1.8 MB Wed Aug 28 16:00:13 2024  Squirrel-Mono.exe
.rw-------  21 KB Wed Aug 28 16:00:13 2024 󰪪 Squirrel-Mono.pdb
.rw------- 7.5 KB Wed Aug 28 16:00:13 2024  Squirrel.com
.rw------- 1.8 MB Wed Aug 28 16:00:13 2024  Squirrel.exe
.rw-------  22 KB Wed Aug 28 16:00:13 2024 󰪪 Squirrel.pdb
```

After build the files are in `build/Release/net45`.

Copy files to temp `cp update.com Update{,-Mono}.{exe,pdb} /tmp/`

```
rename update Squirrel /tmp/update*
rename Update Squirrel /tmp/Update*
```

And move them to `./assets/` folder.

## Update 7-Zip binaries

Bundled `7z*.dll` / `7z*.exe` files are used by Squirrel.Windows for archive handling on Windows installers. They are sourced from the official [7-Zip](https://www.7-zip.org/download.html) release (currently **26.02**).

1. Download the latest Windows installers from https://www.7-zip.org/a/ (e.g. **26.02**):
    - `7z2602.exe` (x86)
    - `7z2602-x64.exe` (x64)
    - `7z2602-arm64.exe` (ARM64)
2. Extract each installer (e.g. with 7-Zip) and copy `7z.dll` + `7z.exe` into `./assets/` as:

| Source          | Target in `./assets/`          |
| --------------- | ------------------------------ |
| x86 installer   | `7z.dll`, `7z.exe`             |
| x64 installer   | `7z-x64.dll`, `7z-x64.exe`     |
| ARM64 installer | `7z-arm64.dll`, `7z-arm64.exe` |

3. Re-run the Grype / SOC2 scan to confirm 7-Zip CVEs are cleared.
