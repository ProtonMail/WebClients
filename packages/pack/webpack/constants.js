const BABEL_INCLUDE_NODE_MODULES = [
    'asmcrypto.js',
    'pmcrypto',
    'proton-mail',
    '@proton/pack',
    '@proton/shared',
    '@proton/srp',
    '@proton/sieve',
    '@proton/components',
    '@protontech/mutex-browser',
    '@protontech/interval-tree',
    '@proton/recovery-kit',
    '@pdf-lib/standard-fonts',
    '@pdfme/generator',
    'emoji-mart',
    'idb',
    '@protontech/bip39',
];
const BABEL_EXCLUDE_FILES = ['mailparser.js'];

module.exports = {
    BABEL_EXCLUDE_FILES,
    BABEL_INCLUDE_NODE_MODULES,
};
