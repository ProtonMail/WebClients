const { getSource } = require('./helpers/source');

const bindNodeModulesPrefix = (name) => getSource(`node_modules/${name}`);

const OPENPGP_FILES = ['openpgp/dist/openpgp.min.js', 'openpgp/dist/compat/openpgp.min.js'].map(bindNodeModulesPrefix);

const OPENPGP_WORKERS = ['openpgp/dist/openpgp.worker.min.js'].map(bindNodeModulesPrefix);

const BABEL_INCLUDE_NODE_MODULES = ['asmcrypto.js', 'pmcrypto', 'proton-pack', 'pm-srp', 'react-components'];
const BABEL_EXCLUDE_FILES = ['mailparser.js'];

module.exports = {
    OPENPGP_FILES,
    OPENPGP_WORKERS,
    BABEL_EXCLUDE_FILES,
    BABEL_INCLUDE_NODE_MODULES
};
