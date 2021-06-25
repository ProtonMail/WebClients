const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2));

const SCOPE = '[proton-pack]';

const warn = (msg, info) => {
    console.log(`${chalk.bgMagenta(SCOPE)} ${chalk.bold(msg)}.`);
    if (info) {
        console.log('');
        console.log(`  ${info}`);
        console.log('');
        console.log('');
    }
};

const success = (msg, { time, space = false } = {}) => {
    const txt = `${chalk.bgGreen(SCOPE)} ${chalk.bold(`✓ ${msg}`)}`;
    const message = [txt, time && `(${time})`].filter(Boolean).join('');
    if (space) {
        console.log();
    }
    console.log(message);
};

const json = (data, noSpace) => {
    if (!noSpace) {
        console.log();
    }
    console.log(JSON.stringify(data, null, 2).trim());
    console.log();
};

const error = (e) => {
    console.log(chalk.bgRed(SCOPE), chalk.red(e.message));
    console.log();
    console.log();
    console.error(e);
    process.exit(1);
};

function debug(item, message = 'debug') {
    if (!(argv.v || argv.verbose)) {
        return;
    }
    if (Array.isArray(item) || typeof item === 'object') {
        console.log(`${SCOPE} ${message}`);
        return json(item, true);
    }

    console.log(`${SCOPE} ${message}\n`, item);
}

module.exports = {
    success,
    error,
    json,
    debug,
    warn,
};
