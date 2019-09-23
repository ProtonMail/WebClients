const os = require('os');
const path = require('path');
const { pull, push, bash } = require('proton-bundler');

const { externalFiles } = require('./env/conf.build');

function main(argv) {
    const env = require('./env/config');
    const { apiUrl, branch, statsConfig, sentry } = env.getEnvDeploy({
        env: 'dist',
        config: false
    });

    function tasks({ branch, isCI, flowType }) {
        if (/cobalt/.test(branch) && !argv.qaforce) {
            const msg = [
                `⛔ Do not use [${branch}], it is the QA Branch. Do not update cf wiki server dev.`,
                'Yet, it is possible to deploy on it with if you use this flag when you run the deploy command: --qaforce'
            ].join('\n');
            throw new Error(msg);
        }

        function sed(rule, files) {
            // Because for the lulz. cf https://myshittycode.com/2014/07/24/os-x-sed-extra-characters-at-the-end-of-l-command-error/
            if (os.platform() === 'darwin') {
                return bash(`sed -i '' "${rule}" $(${files})`);
            }
            return bash(`sed -i "${rule}" $(${files})`);
        }

        async function replace(rule) {
            const files = "find dist -type f -name '*.chunk.js' ! -name 'vendor*' ! -name 'app*'";
            await sed(rule, files);
        }

        /**
         * Sync new SRI config:
         *     - Generate hash for files with the modifications
         *     - Replace them inside index.js
         *     - Then we replace the SRI of index.js inside index.htmll
         * @return {Promise}
         */
        async function replaceSRI() {
            const { stdout: stdoutNew } = await bash('./tasks/manageSRI get-new');
            const { stdout: stdoutProd } = await bash('./tasks/manageSRI get-prod');

            // Create {<file>:hash}
            const toList = (input = '') => {
                return input.split('\n').reduce((acc, value, i, list) => {
                    if (i % 2 === 0) {
                        acc[value] = '';
                    }
                    if (i % 2 === 1) {
                        acc[list[i - 1]] = value;
                    }
                    return acc;
                }, {});
            };

            const HASHES_PROD = toList(stdoutProd);
            const HASHES_NEW = toList(stdoutNew);

            // Create sed string for the replace
            const arg = Object.keys(HASHES_PROD)
                .reduce((acc, key) => {
                    const file = key.replace('distCurrent', 'dist');
                    const oldHash = HASHES_PROD[key];
                    const newHash = HASHES_NEW[file];
                    if (oldHash !== newHash) {
                        acc.push(`s|${oldHash}|${newHash}|g;`);
                    }
                    return acc;
                }, [])
                .join('');

            // Bind new hashes
            await bash(`./tasks/manageSRI write-index "${arg}"`);
            // Bind new hash for index.js
            await bash('./tasks/manageSRI write-html');
        }

        /**
         * Check if the sub-build is valid
         *     - Correct SRI for updated files
         *     - Correct SRI for the index
         *     - Right config for A/B
         *     - Right config for Sentry
         * Stop the process if it fails
         */
        async function validateBuild(branch) {
            return bash(`./tasks/manageSRI validate ${branch.replace('deploy-', '')}`);
        }

        /**
         * Create sub bundles of the app as the diff won't exist or
         * is only about one key for A/B testing (prod-b)
         * @param  {String} branch
         * @param  {Boolean} options.start Create cache dist dir
         * @param  {Boolean} options.end   Remove cache dist dir
         * @return {Promise}
         */
        const buildCustomApp = async (branch, { start, end, context } = {}) => {
            const { abSiteId } = statsConfig;
            const { abSiteId: abSiteIdB } = env.getStatsConfig(branch);
            const config = env.getConfig('dist', branch);
            const { sentry: sentryB } = config;

            process.env.NODE_ENV_BRANCH = branch;
            process.env.NODE_ENV_API = config.apiUrl;

            if (start) {
                // Backup build to prevent conditions as it will always be the same things to replace
                await bash('rsync -av --progress dist/ distback --exclude .git');
            }

            // Backup build assets
            const cli = ['rsync -av --progress distback/ distCurrent --exclude .git', 'rm -rf dist'];
            await bash(cli.join(' && '));
            await pull(branch, true);

            // Update previous dist with new assets
            await bash('rsync -av --delete distCurrent/ dist --exclude .git');

            // A/B testing config
            if (/deploy-prod/.test(branch)) {
                await replace(`s/abSiteId:${abSiteId}/abSiteId:${abSiteIdB}/g;`);
            }

            // Replace the correct sentry URL
            await replace(`s|${sentry.sentry}|${sentryB.sentry}|g;`);
            await replaceSRI();
            await validateBuild(branch);

            await bash('rm -rf distCurrent');

            if (end) {
                await bash('rm -rf distback');
            }

            await push(branch, context);
        };

        const checkEnv = async () => {
            try {
                await bash('[ -e ./env/env.json ]');
            } catch (e) {
                throw new Error('You must have env.json to deploy. Cf the wiki');
            }
        };

        const extraTasks = [];

        if (!isCI && flowType === 'many') {
            // Keep prod-b as the latest one as it's the only one with a diff config
            ['dev', 'tor', 'beta', 'prod-b'].forEach((key, i, arr) => {
                extraTasks.push({
                    title: `Create sub-bundle for deploy-${key}`,
                    enabled: () => !isCI && /prod-a$/.test(branch),
                    task(context) {
                        return buildCustomApp(`deploy-${key}`, {
                            start: i === 0,
                            end: i === arr.length - 1,
                            deployBranch: branch,
                            context
                        });
                    }
                });
            });
        }

        const suffixRemote = (target) => {
            return argv[`remote-${target}`] ? '(remote)' : '(local)';
        };

        return {
            customConfigSetup: [
                {
                    title: 'Setup config custom',
                    enabled: () => !isCI,
                    async task(ctx) {
                        await bash('./tasks/setupConfig.js ', process.argv.slice(2));
                        ctx.config = env.getConfig('dist');
                    }
                },
                {
                    title: 'Prepare config sub-bundles',
                    enabled: () => isCI,
                    async task() {
                        await bash(
                            `rm -rf /tmp/app-config || echo 'nope' && git clone ${process.env.APP_CONFIG_REPOSITORY} --depth 1 /tmp/app-config`
                        );
                    }
                }
            ],
            hookPreTasks: [
                {
                    title: 'Check env',
                    task: () => checkEnv()
                },
                {
                    title: 'Check dependencies',
                    task: () => bash('./tasks/checkDependencies.js')
                }
            ],
            hookPostTaskBuild: [
                {
                    title: `Build the settings application ${suffixRemote('pm-settings')}`,
                    skip() {
                        if (argv.settings === false) {
                            return 'Flag --no-settings inside the command.';
                        }
                    },
                    task() {
                        const args = process.argv.slice(3);

                        return bash('npm', ['run', 'build:subproject', '--', '--deploy-subproject=settings', ...args]);
                    }
                },
                {
                    title: `Build the contacts application ${suffixRemote('contacts')}`,
                    skip() {
                        if (argv.contacts === false) {
                            return 'Flag --no-contact inside the command.';
                        }
                    },
                    task() {
                        const args = process.argv.slice(3);
                        return bash('npm', ['run', 'build:subproject', '--', '--deploy-subproject=contacts', ...args]);
                    }
                },
                {
                    title: `Build the calendar application ${suffixRemote('calendar')}`,
                    skip() {
                        return 'Not available for now';
                        if (argv.calendar === false) {
                            return 'Flag --no-calendar inside the command.';
                        }
                    },
                    task() {
                        const args = process.argv.slice(3);
                        return bash('npm', ['run', 'build:subproject', '--', '--deploy-subproject=calendar', ...args]);
                    }
                },
                {
                    title: 'Generate the changelog',
                    enabled: () => !isCI,
                    task(ctx) {
                        const { changelogPath } = ctx.config;
                        const fileName = path.join('dist', changelogPath);
                        return bash('tasks/generateChangelog.js', ['./CHANGELOG.md', fileName]);
                    }
                }
            ],
            hookPostTasks: extraTasks
        };
    }

    const config = {
        apiUrl,
        branch,
        statsConfig,
        sentry,
        EXTERNAL_FILES: externalFiles.list
    };

    return { config, tasks };
}

module.exports = main;
