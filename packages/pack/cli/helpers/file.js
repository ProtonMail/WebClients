const { promises: fs, constants: FS_CONSTANTS } = require('fs');
const path = require('path');

const { warn } = require('./log');

/**
 * Check if a directory exists, else we create it
 * @param  {String}  filePath              Path to a file (or directory if isDir is true)
 * @param  {Boolean} isDir                 The path is not for a file but a hasDirectory
 * @return {void}
 */
async function hasDirectory(filePath, isDir) {
    const dir = isDir ? filePath : path.dirname(filePath);
    try {
        await fs.access(dir, FS_CONSTANTS.F_OK | FS_CONSTANTS.W_OK);
    } catch (e) {
        warn(`Cannot find/write the directory ${dir}, we're going to create it`);
        await fs.mkdir(dir);
    }
}

module.exports = { hasDirectory };
