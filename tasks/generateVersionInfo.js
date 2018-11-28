#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

if (process.argv.length <= 4) {
    console.error(`${process.argv[0]} version commit out`);
    process.exit(1);
}

const outputPath = path.resolve(process.argv[4]);

const info = {
    version: process.argv[2],
    commit: process.argv[3]
};

const out = JSON.stringify(info, null, 2);

fs.writeFileSync(outputPath, out);
