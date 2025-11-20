module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                /* polyfill typed-array base64 and hex functions */
                useBuiltIns: 'usage',
                shippedProposals: true,
                // eslint-disable-next-line import/no-extraneous-dependencies -- fine as a dev dependency
                corejs: require('core-js/package.json').version,
            },
        ],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
    ],
};
