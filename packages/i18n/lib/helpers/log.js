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

    const json = (data) => {
        console.log();
        console.log(`[${scope}] `, JSON.stringify(data, null, 2));
        console.log();
    };

    const error = (e) => {
        console.log(`[${scope}] ${chalk.red(' ⚠'), chalk.red(e.message)}`);
        console.log();
        console.error(e);
        process.exit(1);
    };

    const spin = (text) => ora(text).start();

    return {
        success,
        title,
        error,
        json,
        warn,
        spin
    };
}
