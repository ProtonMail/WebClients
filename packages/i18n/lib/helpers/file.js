const { promises: fs, constants: FS_CONSTANTS } = require('fs');
const path = require('path');

const { warn } = require('./log')('proton-i18n');

async function hasDirectory(fileName) {
    const dir = path.dirname(fileName);
    try {
        await fs.access(dir, FS_CONSTANTS.F_OK | FS_CONSTANTS.W_OK);
    } catch (e) {
        warn(`Cannot find/write the directory ${dir}, we're going to create it`);
        await fs.mkdir(dir);
    }
}

module.exports = { hasDirectory };
