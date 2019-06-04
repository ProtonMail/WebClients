const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const ora = require('ora');

module.exports = (scope) => {
    const warn = (msg) => {
        console.log();
        console.log(`[${scope}] ${chalk.magenta('⚠')} ${chalk.magenta(msg)}.`);
        console.log();
    };

    const success = (msg, { time, space = false } = {}) => {
        const txt = chalk.green(chalk.bold('✔ '));
        const message = [`[${scope}] `, txt, msg, time && `(${time})`].filter(Boolean).join('');
        space && console.log();
        console.log(message);
    };

    const title = (msg) => {
        console.log('~', chalk.bgYellow(chalk.black(msg)), '~');
        console.log();
    };

    const json = (data, output) => {
        // only output for a command
        if (output) {
            return console.log(JSON.stringify(data, null, 2));
        }

        console.log();
        console.log(`[${scope}]`, JSON.stringify(data, null, 2));
        console.log();
    };

    const error = (e) => {
        console.log(`[${scope}] ${(chalk.red(' ⚠'), chalk.red(e.message))}`);
        console.log();
        console.error(e);
        process.exit(1);
    };

    const spin = (text) => ora(text).start();

    function debug(item) {
        if (!(argv.v || argv.verbose)) {
            return;
        }
        if (Array.isArray(item) || typeof item === 'object') {
            return json(item);
        }

        console.log(`[${scope}]`, item);
    }

    return {
        success,
        debug,
        title,
        error,
        json,
        warn,
        spin
    };
};
