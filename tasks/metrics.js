#!/usr/bin/env node

const execa = require('execa');

const getFilesDiff = async (extensions = []) => {
    const list = extensions.map((ext) => `"*.${ext}"`).join(' ');
    const cmd = `git diff --cached --name-only --diff-filter=ACM ${list} | tr '\n' ' '`;
    const { stdout = '' } = await execa.shell(cmd);
    return stdout.split('\n').filter(Boolean);
};

(async () => {

    try {
        const [ jsFiles, cssFiles ] = await Promise.all([
            getFilesDiff(['js']),
        ]);

        if (jsFiles.length) {
            execa('npx', ['cqc', '--verbose', '--complexity-max=5', ...jsFiles])
                .stdout.pipe(process.stdout);
        }

    } catch (e) {
        console.error(e);
    }

})();

