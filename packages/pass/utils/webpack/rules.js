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

/** core-js Uint8Array::fromBase64 polyfill has a slow runtime check in
 * Safari that stalls extension popups for ~2 seconds. Remove the expensive
 * runtime validation while keeping basic feature detection. This is likely
 * a WebKit regression as this does not happen below v26.0.1  */
export const coreJsUint8ArrayFromBase64Rule = {
    test: /core-js\/modules\/es\.uint8-array\.from-base64\.js$/,
    use: {
        loader: 'string-replace-loader',
        options: {
            search: /var INCORRECT_BEHAVIOR_OR_DOESNT_EXISTS = !Uint8Array \|\| !Uint8Array\.fromBase64 \|\| !function \(\) \{[\s\S]*?\}\(\);/,
            replace: 'var INCORRECT_BEHAVIOR_OR_DOESNT_EXISTS = !Uint8Array || !Uint8Array.fromBase64;',
            flags: 'g',
        },
    },
};
