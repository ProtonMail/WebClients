const exec = require('child_process');

/* Use global @redux-devtools/cli to avoid adding it as
 * a dependency to the monorepo : it includes way too many
 * useless dependencies slowing down installation phase and
 * breaks CI runners (electron sub dependency) */
const createReduxDevTools = async ({ port }) => {
    const cmd = exec.spawn(`redux-devtools`, ['--hostname=localhost', `--port=${port}`]);

    cmd.stdout.on('data', (buff) => console.info(buff.toString()));
    cmd.stderr.on('data', (buff) => console.error(buff.toString()));

    cmd.on('error', (buff) => {
        console.error(buff.toString());
        console.warn('Run `yarn workspace @proton/pass install:additional-tools`');
        process.exit(0);
    });

    return cmd;
};

module.exports = createReduxDevTools;
