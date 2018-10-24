#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const execa = require('execa');

const { vendor_files, externalFiles } = require('../env/conf.build');

const makeSRC = (list) => list.map((file) => (/^node_modules/.test(file) ? `./${file}` : file));

const OUTPUT_DIR = process.env.NODE_ENV === 'dist' ? 'dist' : 'build';
const VENDOR_GLOB = makeSRC(vendor_files.js);
const VENDOR_LAZY_GLOB = makeSRC(vendor_files.jsLazy);
const VENDOR_LAZY2_GLOB = makeSRC(vendor_files.jsLazy2);
const VENDOR_LIB_GLOB = ['./src/libraries/{polyfill,tweetWebIntent}.js'];
const [, OPENPGP] = makeSRC(externalFiles.openpgp);

const INPUT = [
    {
        name: 'openpgp.min',
        src: [OPENPGP]
    },
    {
        name: 'vendor',
        src: VENDOR_GLOB.concat(VENDOR_LIB_GLOB)
    },
    {
        name: 'vendorLazy',
        src: VENDOR_LAZY_GLOB
    },
    {
        name: 'vendorLazy2',
        src: VENDOR_LAZY2_GLOB
    }
];

const write = ({ name, src }) => {
    const list = src.join(' ');
    const to = path.join(OUTPUT_DIR, `${name}.js`);
    return execa.shell(`cat ${list} > ${to}`, { shell: '/bin/bash' });
};

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    await Promise.all(INPUT.map(write));
}

main();
