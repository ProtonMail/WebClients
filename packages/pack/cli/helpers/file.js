const { promises: fs, constants: FS_CONSTANTS } = require('fs');

const { warn } = require('./log');

async function hasDirectory(path) {
    try {
        await fs.access(path, FS_CONSTANTS.F_OK | FS_CONSTANTS.W_OK);
    } catch (e) {
        warn(`Cannot find/write the directory ${path}, we're going to create it`);
        await fs.mkdir(path);
    }
}

module.exports = { hasDirectory };
