const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const execRaw = require('child_process').exec;

const execVerbose = (command) => {
    return new Promise((resolve, reject) => {
        const callback = (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        };

        const build = execRaw(
            command,
            {
                maxBuffer: 1000 * 1000 * 10 // 10 MB
            },
            callback
        );
        build.stdout.pipe(process.stdout);
        build.stderr.pipe(process.stderr);
    });
};

module.exports = { execVerbose, exec };
