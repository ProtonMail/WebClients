const { execSync } = require('child_process');
const { readdirSync } = require('fs');

if (process.platform === 'win32') {
    const signtoolArgs = process.env.SQUIRREL_SIGNTOOL_ARGS;
    if (!signtoolArgs) throw new Error('SQUIRREL_SIGNTOOL_ARGS is not set');

    const sign = (file) => {
        console.warn(`Signing ${file}...`);
        execSync(`signtool sign ${signtoolArgs} "${file}"`, { stdio: 'inherit' });
    };

    const nodeFiles = readdirSync('.').filter((f) => f.endsWith('.node'));
    if (nodeFiles.length === 0) throw new Error('No .node files found');

    for (const file of nodeFiles) sign(file);
}
