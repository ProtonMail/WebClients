#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');

const esbuild = require('esbuild');
const browserslistToEsbuild = require('browserslist-to-esbuild');

const isProd = process.env.NODE_ENV === 'production';
const distDir = path.join(__dirname, '../dist');
const srcDir = path.join(__dirname, '../src');

const fileName = 'sandbox.js';
const outFile = path.join(distDir, fileName);

// Step 1 - generate JS bundle
esbuild.buildSync({
    bundle: true,

    platform: 'browser',
    target: browserslistToEsbuild('> 0.5%, not IE 11, Firefox ESR, Safari 11'),

    entryPoints: [path.join(srcDir, 'index.ts')],
    outfile: outFile,

    sourcemap: false,

    minify: isProd,
});

console.log(`✅ Built - ./dist/${fileName}`);

// Step 2 - copy to apps

const apps = ['drive', 'mail'];
const publicPath = 'public/assets';

apps.forEach((app) => {
    fs.copyFileSync(outFile, path.join(__dirname, `../../${app}`, publicPath, fileName));
    console.log(`✅ Copied - applications/${app}/${publicPath}`);
});
