#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const execa = require('execa');
const { error } = require('./helpers/log');
const { spawn } = require('child_process');

const getListFiles = async () => {
    const { stdout = '' } = await execa.shell("find src/{app,helpers} -type f -name '*.js'", { shell: '/bin/bash' });
    return stdout.split('\n');
};

const toChunk = (col, size = 150) => {
    const { chunks, tmp } = col.reduce(
        (acc, dir, i) => {
            acc.tmp.push(dir);
            if (!(i % size) && i !== 0) {
                acc.chunks.push(acc.tmp.slice());
                acc.tmp.length = 0;
            }
            return acc;
        },
        { chunks: [], tmp: [] }
    );

    return chunks.concat([tmp]);
};

const lint = (files, args = []) =>
    new Promise((resolve, reject) => {
        const child = spawn('./node_modules/.bin/eslint', files.concat('--quiet').concat(args), { stdio: 'inherit' });
        child.on('close', resolve);
        child.on('error', reject);
    });

(async () => {
    try {
        if (!fs.existsSync(path.resolve('.', 'src/app/config.js'))) {
            console.log('No config detected ~ auto generating config via npm run config');
            await exec(`npm run config`);
        }

        const list = toChunk(await getListFiles());
        const output = await Promise.all(
            list.map((files) => {
                return lint(files, process.argv.slice(2)).catch(() => 1);
            })
        );

        if (!output.every((code) => code === 0)) {
            process.exit(1);
        }
        process.exit(0);
    } catch (e) {
        error(e);
    }
})();
