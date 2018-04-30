#!/usr/bin/env node

const exec = require('child_process').exec;
const gulp = require('gulp');
const concat = require('gulp-concat');
const glob = require('glob');
const CONFIG = require('../env/conf.build');
const { CONFIG: APP_CONFIG } = require('../env/config').getConfig();

const OUTPUT_DIR = process.env.NODE_ENV === 'dist' ? 'dist' : 'build';

const makeSRC = (list) => list.map((file) => (/^node_modules/.test(file) ? `./${file}` : file));

const VENDOR_GLOB = makeSRC(CONFIG.vendor_files.js);
const VENDOR_LAZY_GLOB = makeSRC(CONFIG.vendor_files.jsLazy);
const VENDOR_LAZY2_GLOB = makeSRC(CONFIG.vendor_files.jsLazy2);
const VENDOR_LIB_GLOB = makeSRC(glob.sync('./src/libraries/{polyfill,tweetWebIntent,mailparser}.js'));
const [, OPENPGP] = makeSRC(CONFIG.externalFiles.openpgp);

[
    {
        name: 'openpgp.min',
        src: `./${OPENPGP}`
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
].forEach(({ name, src }) => {
    gulp
        .src(src)
        .pipe(concat(`${name}.js`))
        .pipe(gulp.dest(`${OUTPUT_DIR}/`));
});

exec(`tasks/generateChangelog.js ./CHANGELOG.md ${OUTPUT_DIR}/${APP_CONFIG.changelogPath}`);
