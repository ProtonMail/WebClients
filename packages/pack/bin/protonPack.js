#!/usr/bin/env node
const fs = require('fs').promises;
const execa = require('execa');
const path = require('path');
const { Command } = require('commander');
const portfinder = require('portfinder');
const chalk = require('chalk');

const program = new Command();

const { getConfigData, getApi, getConfigFile, getConfigHead } = require('../lib/config');

const getPort = (basePort) => {
    portfinder.basePort = basePort;
    return portfinder.getPortPromise();
};

const writeConfig = async (configFile) => {
    const configPath = path.resolve('./src/app/config.ts');
    console.log(`writing file ${configPath}`);

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, configFile);
};

const writeConfigHead = async (configFile) => {
    const configPath = path.resolve('./src/config.ejs');
    console.log(`writing file ${configPath}`);

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, configFile);
};

const addGlobalOptions = (program) => {
    return program
        .option('--appMode <appMode>', '')
        .option('--analyze', '')
        .option('--optimizeAssets', '')
        .option('--featureFlags <featureFlags>', '')
        .option('--api <api>', '', (api) => getApi(api), getApi(''))
        .option('--sso <sso>', '')
        .option('--no-api-proxy', '')
        .option('--inline-icons', false)
        .option('--webpackOnCaffeine', '', false)
        .option('--handleSupportAndErrors', '', false)
        .option('--configV2', '', false)
        .option('--logical', '', false)
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

const getWebpackArgsV2 = (options, env) => {
    const extraWebpackArgs = env.args.join(' ');
    return `--env protonPackOptions=${JSON.stringify(options)} ${extraWebpackArgs}`;
};

const getWebpackArgs = (options, env, { appData, buildData }) => {
    const envArgs = {
        api: appData.api === '/api' ? undefined : appData.api,
        sso: appData.sso,
        appMode: options.appMode,
        publicPath: options.publicPath === '/' ? undefined : options.publicPath,
        featureFlags: options.featureFlags,
        writeSri: options.sri ? undefined : options.sri,
        inlineIcons: options.inlineIcons,
        warningLogs: options.warningLogs,
        errorLogs: options.errorLogs,
        overlayWarnings: options.overlayWarnings,
        overlayErrors: options.overlayErrors,
        overlayRuntimeErrors: options.overlayRuntimeErrors,
        logical: Boolean(options.logical),
        webpackOnCaffeine: Boolean(options.webpackOnCaffeine),
        handleSupportAndErrors: Boolean(options.handleSupportAndErrors),
        analyze: options.analyze,
        optimizeAssets: options.optimizeAssets,
        ...buildData,
    };
    const extraWebpackArgs = env.args.join(' ');
    const webpackEnvArgs = Object.entries(envArgs)
        .filter(([, value]) => value !== undefined && value !== '')
        .reduce((acc, [key, value]) => {
            if (typeof value === 'boolean') {
                if (value) {
                    return `${acc} --env ${key}`;
                } else {
                    return acc;
                }
            }

            return `${acc} --env ${key}=${value.replace(/ /g, '\\ ')}`;
        }, '');

    return `${webpackEnvArgs} ${extraWebpackArgs}`;
};

const commandWithLog = (...args) => {
    console.log(chalk.cyan(args[0]), `\n`);
    return execa.command(...args);
};

addGlobalOptions(program.command('build').description('create an optimized production build'))
    .option('--no-sri', 'disable sri')
    .action(async (options, env) => {
        console.log(chalk.magenta('Creating a production build...\n'));

        let webpackArgs;

        if (options.configV2) {
            webpackArgs = getWebpackArgsV2(options, env);
        } else {
            const configData = getConfigData(options);
            if (options.optimizeAssets) {
                await writeConfigHead(getConfigHead(configData));
            } else {
                await writeConfig(getConfigFile(configData));
            }
            webpackArgs = getWebpackArgs(options, env, configData);
        }

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
        console.log(chalk.magenta('Starting development server...\n'));

        let webpackArgs;

        if (options.configV2) {
            webpackArgs = getWebpackArgsV2(options, env);
        } else {
            const configData = getConfigData(options);
            if (options.optimizeAssets) {
                await writeConfigHead(getConfigHead(configData));
            } else {
                await writeConfig(getConfigFile(configData));
            }
            webpackArgs = getWebpackArgs(options, env, configData);
        }

        const port = await getPort(options.port || 8080);

        await commandWithLog(
            `${require.resolve('webpack-cli/bin/cli.js')} serve --progress --port=${port} ${webpackArgs}`,
            {
                stdio: 'inherit',
            }
        );
    });

addGlobalOptions(program.command('config').description('write config'))
    .option('--version <version>', 'override the default (based on the tag) version number')
    .action(async (options) => {
        if (options.configV2) {
            return;
        }
        const configData = getConfigData(options);
        if (options.optimizeAssets) {
            await writeConfigHead(getConfigHead(configData));
        } else {
            await writeConfig(getConfigFile(configData));
        }
    });

program.parse(process.argv);
