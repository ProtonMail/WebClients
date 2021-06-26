const { getSource } = require('./helpers/source');

const bindNodeModulesPrefix = (name) => getSource(`node_modules/${name}`);

const OPENPGP_FILES = Object.fromEntries(
    Object.entries({
        main: 'openpgp/dist/lightweight/openpgp.min.js',
        elliptic: 'openpgp/dist/lightweight/elliptic.min.js',
        worker: 'openpgp/dist/lightweight/openpgp.worker.min.js',
        compat: 'openpgp/dist/compat/openpgp.min.js'
    }).map(([k, v]) => [k, bindNodeModulesPrefix(v)])
);

const BABEL_INCLUDE_NODE_MODULES = [
    'asmcrypto.js',
    'pmcrypto',
    'proton-pack',
    'proton-shared',
    'mutex-browser',
    'interval-tree',
    'get-random-values',
    'sieve.js',
    'pm-srp',
    'react-components',
    'idb'
];
const BABEL_EXCLUDE_FILES = ['mailparser.js'];

module.exports = {
    OPENPGP_FILES,
    BABEL_EXCLUDE_FILES,
    BABEL_INCLUDE_NODE_MODULES
};
