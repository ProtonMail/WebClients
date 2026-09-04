module.exports = {
    transform: {
        '^.+\\.(ts|js|mjs)x?$': [
            require.resolve('@swc/jest'),
            {
                jsc: {
                    transform: {
                        react: {
                            runtime: 'automatic',
                        },
                    },
                    parser: {
                        jsx: true,
                        syntax: 'typescript',
                        tsx: true,
                    },
                },
                env: {
                    /* polyfill typed-array base64 and hex functions */
                    mode: 'usage',
                    shippedProposals: true,
                    coreJs: require('core-js/package.json').version,
                },
            },
        ],
    },
};
