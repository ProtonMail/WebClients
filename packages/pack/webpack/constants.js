const TRANSPILE_NODE_MODULES = [
    '@protontech/crypto',
    '@protontech/logger',
    'proton-mail',
    '@proton/pack',
    '@proton/shared',
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
    '@scure/base',
    'pdfjs-dist',
];
const TRANSPILE_EXCLUDE_FILES = ['mailparser.js'];

module.exports = {
    TRANSPILE_EXCLUDE_FILES,
    TRANSPILE_NODE_MODULES,
};
