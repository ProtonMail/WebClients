const { logCommits } = require('./git');
const coucou = require('./helpers/coucou');
const { bash, script } = require('./helpers/cli');
const { debug } = require('./helpers/log')('proton-bundler');

async function main(branch = '', PKG, { flow, website }) {
    try {
        const output = await logCommits(branch, flow, website);

        debug(output, 'log-commits');

        // Feature not available without this CLI
        if (!process.env.MESSAGE_DEPLOY_CLI) {
            return console.log(output);
        }

        const name = PKG.name.toLowerCase().replace(/^proton-/, '');
        const project = name === 'web' ? 'webclient' : name;

        const json = output.split('\n').reduce(
            (acc, item) => {
                const [hash, scope] = item.trim().split('---');
                acc.config[scope] = hash;
                return acc;
            },
            {
                project,
                website,
                config: {}
            }
        );

        // Prepare -> clone if it doesn't exist else use it as it is + update
        await script('prepareMessageDeploy.sh', [process.env.MESSAGE_DEPLOY_CLI], 'inherit');
        const { stdout } = await bash(`echo '${JSON.stringify(json)}' | /tmp/deployMessage/generate`);

        debug(stdout, 'message deploy');

        if (/deploy-(beta|prod|old|tor|dev)/.test(branch)) {
            const [, env] = branch.match(/deploy-(beta|prod|old|tor|dev)/);
            coucou.send(stdout, { env, flowType: flow }, PKG);
        }
    } catch (e) {
        // Osef if it fails
        debug(e, 'Error ask deploy');
    }
}

module.exports = main;
