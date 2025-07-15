/** Force tree-shaking on dependencies which are not flagged
 * as side-effects free in their respective package.json files. */
export const sideEffectsRule = {
    test: /node_modules\/(@unleash\/proxy-client-react|unleash-proxy-client)/,
    sideEffects: false,
};

/** @zip.js/zip.js uses `import.meta.url` constructs for non-browser
 * based builds. Webpack will evaluate these at build-time making
 * builds non-reproducible and dependent on the current build folder. */
export const zipJSRule = {
    test: /\.js$/,
    include: /node_modules\/@zip\.js\/zip\.js/,
    use: {
        loader: 'string-replace-loader',
        options: {
            search: 'import.meta.url',
            replace: 'undefined',
            flags: 'g',
        },
    },
};
