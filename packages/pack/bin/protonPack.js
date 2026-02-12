#!/usr/bin/env node
const fs = require('fs').promises;
const execa = require('execa');
const path = require('path');
const { Command } = require('commander');
const portfinder = require('portfinder');
const { styleText } = require('node:util');

const program = new Command();

const getApi = (value) => {
    if (value.startsWith('http') || value.startsWith('/api')) {
        return value;
    }
    throw new Error('--api must start with http or /api');
};

const getPort = (basePort) => {
    portfinder.basePort = basePort;
    return portfinder.getPortPromise();
};

const addGlobalOptions = (program) => {
    return program
        .option('--appMode <appMode>', '')
        .option('--analyze', '')
        .option('--optimizeAssets', '')
        .option('--babelLoader', '')
        .option('--featureFlags <featureFlags>', '')
        .option('--api <api>', '', (api) => getApi(api), '')
        .option('--sso <sso>', '')
        .option('--no-api-proxy', '')
        .option('--inline-icons', false)
        .option('--handleSupportAndErrors', '', false)
        .option('--noLogicalScss', '', false)
        .option('--benchmarkBuild', '', false)
        .option(
            '--prependAsyncCss',
            'prepend css chunks that are loaded asynchronously so that the initial css file gets priority'
        )
        .option(
            '--publicPath <publicPath>',
            '',
            (publicPath) => {
                if (publicPath && (!publicPath.startsWith('/') || !publicPath.endsWith('/'))) {
                    throw new Error('--publicPath must start and end with a forward slash');
                }
                return publicPath || '/';
            },
            '/'
        );
};

const getWebpackArgs = (options, env) => {
    const extraWebpackArgs = env.args.join(' ');
    return `--env protonPackOptions=${JSON.stringify(options)} ${extraWebpackArgs}`;
};

const commandWithLog = (...args) => {
    // eslint-disable-next-line no-console
    console.log(styleText('cyan', args[0]), '\n');
    return execa.command(...args);
};

addGlobalOptions(program.command('build').description('create an optimized production build'))
    .option('--no-sri', 'disable sri')
    .action(async (options, env) => {
        // eslint-disable-next-line no-console
        console.log(styleText('magenta', 'Creating a production build...\n'));

        const webpackArgs = getWebpackArgs(options, env);

        const outputPath = path.resolve('./dist');
        await commandWithLog(`rm -rf ${outputPath}`);
        await commandWithLog(
            `${require.resolve('webpack-cli/bin/cli.js')} --progress --output-path=${outputPath} ${webpackArgs}`,
            {
                stdio: 'inherit',
            }
        );
        await commandWithLog(`${path.resolve(__dirname, `../scripts/validate.sh`)} ${outputPath}`, {
            stdio: 'inherit',
        });
        const dotFiles = await Promise.all(
            ['.htaccess', '.well-known'].map(async (file) => {
                try {
                    await fs.access(`${outputPath}/${file}`);
                    return file;
                } catch {}
            })
        );
        await commandWithLog(`tar -czvf ../webapp-bundle.tar.gz * ${dotFiles.filter(Boolean).join(' ')} 2> /dev/null`, {
            stdio: 'inherit',
            cwd: outputPath,
            shell: true,
        });
    });

addGlobalOptions(program.command('dev-server').description('run locally'))
    .option('--port <port>', '')
    .option('--warning-logs', 'emit typescript and eslint warnings')
    .option('--no-error-logs', 'do not emit typescript and eslint errors')
    .option('--overlay-warnings', 'show a full screen overlay when there are compiler warnings')
    .option('--overlay-runtime-errors', 'show a full screen overlay when there are runtime errors')
    .option('--overlay-errors', 'show a full screen overlay when there are compiler errors')
    .action(async (options, env) => {
        // eslint-disable-next-line no-console
        console.log(styleText('magenta', 'Starting development server...\n'));

        const webpackArgs = getWebpackArgs(options, env);

        const port = await getPort(options.port || 8080);

        await commandWithLog(
            `${require.resolve('webpack-cli/bin/cli.js')} serve --progress --port=${port} ${webpackArgs}`,
            {
                stdio: 'inherit',
            }
        );
    });

program.parse(process.argv);
