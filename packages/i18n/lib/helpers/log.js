const chalk = require('chalk');

const { IS_VERBOSE } = process.env;

module.exports = (scope) => {
    const warn = (msg, addSpaces = true) => {
        addSpaces && console.log();
        console.log(chalk.bgMagenta(chalk.white('[warning]')), msg);
        addSpaces && console.log();
    };

    const info = (msg, addSpaces = true) => {
        addSpaces && console.log();
        console.log(chalk.bgGrey('[info]'), msg);
        addSpaces && console.log();
    };

    const success = (msg, { time, space = false } = {}) => {
        const txt = chalk.bold(' ✔ ');
        const message = [chalk.bgGreen(chalk.black(`[${scope}]`)), txt, msg, time && ` (${time})`]
            .filter(Boolean)
            .join('');
        space && console.log();
        console.log(message);
    };

    const json = (data, output, noSpace) => {
        // only output for a command
        if (output) {
            return console.log(JSON.stringify(data, null, 2));
        }
        !noSpace && console.log();
        !noSpace && console.log(`[${scope}]`, JSON.stringify(data, null, 2));
        noSpace && console.log(JSON.stringify(data, null, 2));
        console.log();
    };

    const error = (e) => {
        console.log(chalk.bgRed(chalk.bold(chalk.white('[error]'))), e.message);

        // Better log for CLI commands, better than a JSON version of stdX
        if (e.stdout || e.stderr) {
            console.log();
            console.log('------------------------ [Stdout + stderr] -----------------------');
            console.log(e.stdout);
            console.error(e.stderr);
            process.exit(1);
        }

        if (IS_VERBOSE) {
            console.error(e);
        }

        process.exit(1);
    };

    function debug(item, message = 'debug') {
        if (!IS_VERBOSE) {
            return;
        }

        if (item instanceof Error) {
            console.log(`[${scope}]`, message);
            error(item);
        }

        if (Array.isArray(item) || typeof item === 'object') {
            console.log(`[${scope}]`, message);
            return json(item, false, true);
        }
        console.log(`[${scope}] ${message} \n`, item);
    }

    return {
        success,
        json,
        debug,
        error,
        info,
        warn,
    };
};
