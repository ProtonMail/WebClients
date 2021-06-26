const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

module.exports = (scope) => {
    const IS_VERBOSE = argv.v || argv.verbose;

    const warn = (msg) => {
        console.log('');
        console.log(chalk.bgMagenta(chalk.white('[warning]')), msg);
        console.log('');
    };

    const info = (msg, addSpaces = false) => {
        addSpaces && console.log();
        console.log(chalk.bgGrey('[info]'), msg);
        addSpaces && console.log();
    };

    const success = (msg, { time, space = false } = {}) => {
        const txt = chalk.bold(' ✔ ');
        const message = [chalk.bgGreen(chalk.black(`[${scope}]`)), txt, msg, time && ` (${time})`]
            .filter(Boolean)
            .join('');
        space && console.log('');
        console.log(message);
    };

    const title = (msg) => {
        console.log('~', chalk.bgYellow(chalk.black(msg)), '~');
        console.log('');
    };

    const json = (data, output, noSpace) => {
        // only output for a command
        if (output) {
            return console.log(JSON.stringify(data, null, 2));
        }
        !noSpace && console.log('');
        !noSpace && console.log(`[${scope}]`, JSON.stringify(data, null, 2));
        noSpace && console.log(JSON.stringify(data, null, 2));
        console.log('');
    };

    const error = (e) => {
        const { outputBuild = {} } = e.context || {};
        const hasBuildError = outputBuild.stdout || outputBuild.stderr;
        // Better log for webpack errors
        if (hasBuildError) {
            console.log(chalk.bgRed(chalk.bold(chalk.white('[error]'))), 'webpack build error');
            console.log(outputBuild.stdout);
            console.log(outputBuild.stderr);
        }

        console.log(chalk.bgRed(chalk.bold(chalk.white('[error]'))), e.message);

        // Better log for CLI commands, better than a JSON version of stdX
        if (e.stdout || e.stderr) {
            console.log('');
            console.log('Stdout + stderr');
            console.log(e.stdout);
            console.error(e.stderr);
            process.exit(1);
        }

        !hasBuildError && console.error(e);
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

    function about(config) {
        Object.keys(config).forEach((key) => {
            console.log(`➙ ${key}: ${chalk.bgYellow(chalk.black(config[key]))}`);
        });
        console.log('');
    }

    return {
        success,
        info,
        about,
        debug,
        title,
        error,
        json,
        warn,
        IS_VERBOSE
    };
};
