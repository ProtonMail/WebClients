const { pull, push } = require('./lib/git');
const { bash } = require('./lib/helpers/cli');
const log = require('./lib/helpers/log');

module.exports = { pull, push, bash, log: log('proton-bundler') };
