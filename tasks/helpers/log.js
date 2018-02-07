const chalk = require('chalk');

const success = (msg) => console.log(`${chalk.green('✓')} ${msg}.`);

const title = (msg) => console.log('~', chalk.bgYellow(chalk.black(msg)), '~');

const json = (data) => {
    console.log();
    console.log(JSON.stringify(data, null, 2));
    console.log();
};

const error = (e) => {
    console.log(chalk.magentaBright(' ⚠ '), chalk.red(e.message));
    process.exit(1);
};

module.exports = {
    success, title, error, json
};
