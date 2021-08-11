const bindNodeModulesPrefix = (name) => require.resolve(name);

const OPENPGP_FILES = Object.fromEntries(
    Object.entries({
        main: 'openpgp/dist/lightweight/openpgp.min.js',
        elliptic: 'openpgp/dist/lightweight/elliptic.min.js',
        worker: 'openpgp/dist/lightweight/openpgp.worker.min.js',
        compat: 'openpgp/dist/compat/openpgp.min.js',
    }).map(([k, v]) => [k, bindNodeModulesPrefix(v)])
);

const BABEL_INCLUDE_NODE_MODULES = [
    'asmcrypto.js',
    'pmcrypto',
    '@proton/pack',
    '@proton/shared',
    '@proton/get-random-values',
    '@proton/srp',
    '@proton/components',
    'mutex-browser',
    'interval-tree',
    'sieve.js',
    'idb',
    'bip39',
];
const BABEL_EXCLUDE_FILES = ['mailparser.js'];

module.exports = {
    OPENPGP_FILES,
    BABEL_EXCLUDE_FILES,
    BABEL_INCLUDE_NODE_MODULES,
};
