#!/usr/bin/env node

const {
    promises: { access, rm },
    constants: FS_CONSTANTS,
} = require('fs');
const path = require('path');
const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2), {
    string: ['buildMode'],
    boolean: ['verbose'],
    default: {
        verbose: false,
        buildMode: 'standalone',
    },
});

const { bash, script } = require('./lib/helpers/cli');

const IS_VERBOSE = process.env.IS_VERBOSE || argv.verbose;
const hashFileOrDirectory = (itemPath) => access(itemPath, FS_CONSTANTS.R_OK);

async function main() {
    const tasks = [
        {
            title: 'Setup app config',
            task() {
                return bash('yarn run pack', process.argv.slice(2));
            },
        },
        {
            title: 'Clear previous dist',
            async task() {
                const outputDir = path.join(process.cwd(), 'dist');

                try {
                    await hashFileOrDirectory(outputDir);
                    await rm(outputDir);
                } catch (e) {
                    // osef if we don't have the directory
                }
            },
        },
        {
            title: 'Build the application',
            async task(ctx = {}) {
                const { buildMode } = argv;
                const args = process.argv.slice(2);
                if (buildMode === 'sso') {
                    const output = await bash('yarn', ['run', 'build:sso', '--', ...args]);
                    ctx.outputBuild = output;
                    return true;
                }

                if (buildMode === 'standalone') {
                    const output = await bash('yarn', ['run', 'build:standalone', '--', ...args]);
                    ctx.outputBuild = output;
                    return true;
                }

                if (buildMode === 'standalone-with-prefix-path') {
                    const output = await bash('yarn', [
                        'run',
                        'build:standalone',
                        '--',
                        '$npm_package_config_publicPathFlag',
                        ...args,
                    ]);
                    ctx.outputBuild = output;
                    return true;
                }

                const output = await bash('yarn', ['run', 'build', '--', ...args]);
                ctx.outputBuild = output;
                return true;
            },
        },
        {
            title: 'Check the build output content',
            // Extract stdout from the output as webpack can throw error and still use stdout + exit code 0
            async task(ctx = {}) {
                await script('validateBuild.sh');
                delete ctx.outputBuild; // clean as we won't need it anymore
            },
        },
    ];

    for (const { title, task } of tasks) {
        console.log('[~]', title, chalk.cyan('running'));
        await task();
        console.log('[~]', title, chalk.green('ok'));
    }

    console.log('[~]', chalk.green('bundle success'));
}

main().catch((e) => {
    if (IS_VERBOSE) {
        console.error(e);
    }

    console.error(chalk.red('[Error]'), e.message);
    process.exit(1);
});
