const del = require('del');
const { bash, script } = require('../helpers/cli');
const { pull, push } = require('../git');
const { readCurrentRelease } = require('../config');
const { debug } = require('../helpers/log')('proton-bundler');

function main({ branch, argv, hookPostTaskClone }) {
    const list = [
        {
            title: 'Clear previous dist-deploy',
            async task() {
                await del(['dist-deploy'], { dryRun: false });
            }
        },
        {
            title: 'Check if the deploy branch exists',
            skip() {
                if (!(process.env.QA_BRANCHES || '').length) {
                    return 'If you do not have QA_BRANCHES inside your .env you cannot deploy to something new';
                }

                if (`deploy-${process.env.QA_BRANCH}` === branch) {
                    return '🤖 No need to check for this branch, it exists';
                }

                const branches = process.env.QA_BRANCHES.split(',').join('|');
                // Do not try to deploy on QA or cobalt
                if (new RegExp(`^deploy-(cobalt|${branches})$`).test(branch)) {
                    return '✋ You shall not deploy to QA';
                }
            },
            enabled: () => !/^(dev|beta|prod|tor|old)$|prod-/.test(branch.replace('deploy-', '')),
            async task() {
                // For the CI to force SSH
                if (process.env.GIT_REMOTE_URL_CI && argv.fromCi) {
                    await bash(`git remote set-url origin ${process.env.GIT_REMOTE_URL_CI}`);
                }
                return script('createNewDeployBranch.sh', ['--check', branch.replace('deploy-', '')], 'inherit');
            }
        },
        {
            title: `Pull dist branch ${branch}`,
            task: () => pull(branch, argv.forceFetch, argv.fromCi)
        },
        ...hookPostTaskClone,
        {
            title: 'Read information about the release',
            task(ctx) {
                const { version, commit, branch } = readCurrentRelease();
                ctx.originCommit = commit;
                ctx.originBranch = branch;
                ctx.tag = version;
                debug(ctx, 'release env bundle');
            }
        },
        {
            title: 'Sync bundle into dist-deploy directory before we push',
            async task() {
                const cli = ['rsync -av --progress dist/ dist-deploy --exclude .git'];
                await bash(cli.join(' && '));
            }
        },
        {
            title: `Push dist to ${branch}`,
            task: (ctx) => push(branch, ctx)
        },
        {
            title: 'Clear all the things !',
            async task() {
                await del(['dist-deploy'], { dryRun: false });
            }
        }
    ];

    return list;
}

module.exports = main;
