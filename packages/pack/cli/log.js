const chalk = require('chalk');
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
    const txt = `${chalk.bgGreen(SCOPE)} ${chalk.bold('✓ ' + msg)}`;
    const message = [txt, time && `(${time})`].filter(Boolean).join('');
    space && console.log();
    console.log(message);
};

const json = (data) => {
    console.log();
    console.log(JSON.stringify(data, null, 2));
    console.log();
};

const error = (e) => {
    console.log(chalk.bgRed(SCOPE), chalk.red(e.message));
    console.log();
    console.log();
    console.error(e);
    process.exit(1);
};

module.exports = {
    success,
    error,
    json,
    warn
};
