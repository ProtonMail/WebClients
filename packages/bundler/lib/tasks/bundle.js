const del = require('del');
const execa = require('execa');

const { bash, script } = require('../helpers/cli');
const { getConfig } = require('../git');
const { getExternalFiles } = require('../config');
const { debug } = require('../helpers/log')('proton-bundler');

function main({
    argv,
    config: { buildMode, isRemoteBuild },
    hookPreTasks,
    customConfigSetup,
    hookPostTaskBuild,
    hookPostTasks,
}) {
    const configTasks = customConfigSetup.length
        ? customConfigSetup
        : [
              {
                  title: 'Setup app config',
                  task() {
                      return bash('yarn run pack', process.argv.slice(2));
                  },
              },
          ];

    return [
        ...hookPreTasks,
        {
            title: 'Clear previous dist',
            async task() {
                await del(['dist', 'distCurrent', 'distback'], { dryRun: false });
                await bash('mkdir dist');
            },
        },
        {
            title: 'Lint sources',
            enabled: () => argv.lint !== false && !isRemoteBuild,
            task: () => execa('yarn', ['run', 'lint']),
        },
        ...configTasks,
        {
            title: 'Extract git env for the bundle',
            async task(ctx) {
                const { commit, branch, tag } = await getConfig();
                ctx.originCommit = commit;
                ctx.originBranch = branch;
                ctx.tag = tag;
                debug(ctx, 'git env bundle');
            },
        },
        {
            title: 'Copy some files',
            task() {
                const externalFiles = getExternalFiles();
                const rule = externalFiles.length > 1 ? `{${externalFiles.join(',')}}` : externalFiles.join(',');
                return bash(`cp src/${rule} dist/`);
            },
        },
        {
            title: 'Build the application',
            async task(ctx = {}) {
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
        ...hookPostTaskBuild,
        ...hookPostTasks,
    ];
}

module.exports = main;
