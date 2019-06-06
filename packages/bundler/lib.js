const { pull, push } = require('./lib/git');
const { bash } = require('./lib/helpers/cli');

module.exports = { pull, push, bash };
