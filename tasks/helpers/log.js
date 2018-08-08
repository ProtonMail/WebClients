const chalk = require('chalk');

const warn = (msg) => {
    console.log();
    console.log(`${chalk.magenta('⚠')} ${chalk.magenta(msg)}.`);
    console.log();
};

const success = (msg, { time } = {}) => {
    const txt = chalk.green(` ${chalk.bold('✓')} ${msg} `);
    const message = [txt, time && `(${time})`].filter(Boolean).join('');
    console.log();
    console.log(message);
};

const title = (msg) => {
    console.log('~', chalk.bgYellow(chalk.black(msg)), '~');
    console.log();
};

const json = (data) => {
    console.log();
    console.log(JSON.stringify(data, null, 2));
    console.log();
};

const error = (e) => {
    console.log();
    console.log(chalk.red(' ⚠'), chalk.red(e.message));
    console.log();
    console.log();
    process.exit(1);
};

module.exports = {
    success,
    title,
    error,
    json,
    warn
};
