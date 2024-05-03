#!/usr/bin/env node

/* eslint-disable no-console */
import browserslistToEsbuild from 'browserslist-to-esbuild';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';
const distDir = './dist';
const srcDir = './src';

const fileName = 'sandbox.js';
const outFile = path.join(distDir, fileName);

// Step 1 - generate JS bundle
esbuild.buildSync({
    bundle: true,

    platform: 'browser',
    target: browserslistToEsbuild('> 0.5%, not IE 11, Firefox ESR, Safari 14, iOS 14'),

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
    fs.copyFileSync(outFile, path.join(`../${app}`, publicPath, fileName));
    console.log(`✅ Copied - applications/${app}/${publicPath}`);
});
