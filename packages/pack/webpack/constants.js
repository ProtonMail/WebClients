const BABEL_INCLUDE_NODE_MODULES = [
    'asmcrypto.js',
    'pmcrypto-v7',
    '@proton/pack',
    '@proton/shared',
    '@proton/get-random-values',
    '@proton/srp',
    '@proton/components',
    '@protontech/mutex-browser',
    '@protontech/interval-tree',
    '@protontech/sieve.js',
    'idb',
    '@protontech/bip39',
];
const BABEL_EXCLUDE_FILES = ['mailparser.js'];

module.exports = {
    BABEL_EXCLUDE_FILES,
    BABEL_INCLUDE_NODE_MODULES,
};
