const { execSync } = require('child_process');

const targets = (() => {
    switch (process.platform) {
        case 'win32':
            return ['x86_64-pc-windows-msvc'];
        case 'darwin':
            return ['x86_64-apple-darwin', 'aarch64-apple-darwin'];
        case 'linux':
            return ['x86_64-unknown-linux-musl', 'x86_64-unknown-linux-gnu'];
    }
})();

for (const target of targets) {
    execSync(`rustup target add ${target}`, { stdio: 'inherit' });
    execSync(`npm run build -- --target ${target}`, { stdio: 'inherit' });
}

if (process.platform === 'darwin') {
    execSync('mv *.node artifacts');
    execSync('npm run universal');

    // Only skip codesigning when building for Mac App Store because signing happens afterward.
    if (!process.env.SKIP_CODESIGN) {
        // HACK: @electron-forge/plugin-webpack requires .node files to come from ./node_modules
        const codesignIdentity =
            process.env.PASS_CODESIGN_IDENTITY ||
            "$(security find-identity -p codesigning -v | sed '$d' | awk '{print $2}' | head -n 1)";
        execSync(`codesign -s ${codesignIdentity} -f *.node`);
    }
    execSync('mkdir -p ../node_modules/_forgenative && cp -R *.node ../node_modules/_forgenative');
}
