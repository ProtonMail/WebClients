const { execSync } = require('child_process');

const targets = (() => {
    switch (process.platform) {
        case 'win32':
            return ['x86_64-pc-windows-msvc'];
        case 'darwin':
            return ['x86_64-apple-darwin', 'aarch64-apple-darwin'];
        case 'linux':
            // If building on a parallels VM - switch target
            // architecture to arm64 and run with `ELECTRON_DISABLE_SANDBOX=1`
            // return ['aarch64-unknown-linux-gnu'];
            return ['x86_64-unknown-linux-gnu'];
    }
})();

for (const target of targets) {
    // Ensure rust target
    execSync(`rustup target add ${target}`, { stdio: 'inherit' });
    // Build napi bindings
    execSync(`npm run build:napi -- --target ${target}`, { stdio: 'inherit' });
    // Build rust host
    execSync(`npm run build:host -- --target ${target}`, { stdio: 'inherit' });
}

// One build without target to have a /release build for dev
execSync(`npm run build:host`, { stdio: 'inherit' });

if (process.platform === 'darwin') {
    // Code sign mode binaries for macos
    const codesignIdentity =
        process.env.PASS_CODESIGN_IDENTITY ||
        (process.env.CI && "$(security find-identity -p codesigning -v | sed '$d' | awk '{print $2}' | head -n 1)");
    const sign = !process.env.SKIP_CODESIGN && !!codesignIdentity;

    console.warn('Codesign identity', { PASS_CODESIGN_IDENTITY: process.env.PASS_CODESIGN_IDENTITY, codesignIdentity });

    // Saving original built files in artifacts folder
    execSync('cp *.node artifacts');
    // Combine built binaries into one universal binary https://napi.rs/docs/cli/universalize
    execSync('npm run universalize');
    if (sign) execSync(`codesign -s ${codesignIdentity} -f *.node`);
    // HACK: @electron-forge/plugin-webpack requires .node files to come from ./node_modules
    execSync('mkdir -p ../node_modules/_forgenative && cp -R *.node ../node_modules/_forgenative');

    // Host sign and copy to assets
    execSync(
        'lipo -create -output ../assets/proton_pass_nm_host target/aarch64-apple-darwin/release/proton_pass_nm_host target/x86_64-apple-darwin/release/proton_pass_nm_host'
    );
    if (sign) execSync(`codesign -s ${codesignIdentity} -f ../assets/proton_pass_nm_host`);
}

if (process.platform === 'win32') {
    console.warn('Copying native messaging host');

    execSync(
        'powershell -NoLogo -NoProfile -NonInteractive -Command ' +
            '"Copy-Item .\\target\\x86_64-pc-windows-msvc\\release\\proton_pass_nm_host.exe -Destination ../assets -Force"'
    );
}
