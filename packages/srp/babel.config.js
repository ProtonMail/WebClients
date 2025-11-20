module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                /* polyfill needed for typed-array base64 and hex functions */
                useBuiltIns: 'usage',
                shippedProposals: true,
                corejs: require('core-js/package.json').version,
            },
        ],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
    ],
};
