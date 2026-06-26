const browserslist = require('browserslist');

// Custom Jest transform implementation that injects test-specific babel presets.
module.exports = require('babel-jest').default.createTransformer({
    presets: [
        [
            '@babel/preset-env',
            {
                /* polyfill needed for typed-array base64 and hex functions */
                useBuiltIns: 'usage',
                shippedProposals: true,
                corejs: require('core-js/package.json').version,
                targets: {
                    browsers: browserslist(null, { env: 'production' }).join(', '),
                },
            },
        ],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
    ],
    plugins: [
        '@babel/plugin-transform-runtime',
        'babel-plugin-transform-import-meta',
        'transform-class-properties',
        'transform-require-context',
    ],
});
