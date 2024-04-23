const BABEL_INCLUDE_NODE_MODULES = [
    'asmcrypto.js',
    'pmcrypto',
    'pmcrypto-v6-canary',
    'proton-mail',
    '@proton/pack',
    '@proton/shared',
    '@proton/srp',
    '@proton/sieve',
    '@sentry/core',
    '@floating-ui/utils',
    '@floating-ui/core',
    '@floating-ui/dom',
    '@proton/components',
    '@protontech/mutex-browser',
    '@protontech/interval-tree',
    '@proton/recovery-kit',
    'emoji-mart',
    'idb',
    '@protontech/bip39',
    '@reduxjs/toolkit',
    'react-redux',
    'reselect',
    'immer',
];
const BABEL_EXCLUDE_FILES = ['mailparser.js'];

module.exports = {
    BABEL_EXCLUDE_FILES,
    BABEL_INCLUDE_NODE_MODULES,
};
