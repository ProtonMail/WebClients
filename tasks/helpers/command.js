const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const execRaw = require('child_process').exec;
const toCLI = (cmd) => (Array.isArray(cmd) ? cmd.join(' && ') : cmd);

const execVerbose = (command) => {
    return new Promise((resolve, reject) => {
        const callback = (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        };

        const build = execRaw(
            toCLI(command),
            {
                shell: '/bin/bash',
                maxBuffer: 1000 * 1000 * 10 // 10 MB
            },
            callback
        );
        build.stdout.pipe(process.stdout);
        build.stderr.pipe(process.stderr);
    });
};

module.exports = {
    execVerbose,
    exec(command) {
        return exec(toCLI(command), { shell: '/bin/bash' });
    }
};
