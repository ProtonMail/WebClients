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

-   Installing 2019 version v142 and .NET 4.5
    ```
    choco install visualstudio2019buildtools
    ```
-   modify -> add these:
    -   Workloads:
        -   `Desktop development C++`
        -   `.NET desktop build tools`
    -   Individual:
        -   `.NET SDK (out of support)`
        -   `C++ ATL for latest v142 build tools (x86 & x64)`
        -   `.NET Framework 3.5 development tools`
-   In windows `Sever Manager` we need to add feature `.NET Framework 3.5 features`

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
