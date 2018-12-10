const path = require('path');

const { transformFile } = require('./files');

/**
 * Why do we transform openpgp like this?
 *
 * 1. We load openpgp externally with module build for modern browsers and compat build for older browsers.
 * 2. We have to transform the worker files to point to the correct openpgp file.
 *
 * That means we first have to calculate the hash of the openpgp file to get the resulting filename.
 * After that, we have to replace the reference to openpgp.min.js in the worker file to the correct filename,
 * and only after that can we calculate the hash of the worker file. Otherwise it would end up with an
 * incorrect hash if the openpgp file has changed, which would break the cache busting.
 *
 * Thus we do this manually and then use the WriteWebpackPlugin to write the files.
 *
 * Finally, we can use the ejs loader and WebpackDefinePlugin to get the correct references inside
 * our js and html files.
 */

/**
 * Transform the openpgp paths.
 * @param {String} filepath
 * @param {String} basename
 * @param {String} ext
 * @param {String} hash
 * @returns {string}
 */
const transformPath = ({ filepath, basename, ext, hash }) => {
    return [
        // The openpgp files have the same file name, so make a special case if the path includes the compats directory.
        filepath.includes('compat') ? `${basename}.compat` : basename,
        hash,
        ext
    ]
        .filter(Boolean)
        .join('.');
};

/**
 * Transform the contents inside the worker file.
 * Replace the reference to the openpgp js file from importScripts.
 * @param {String} contents
 * @param {String} toFilepath
 * @returns {String}
 */
const transformWorkerContents = (contents, toFilepath) => {
    return contents.replace('openpgp.min.js', toFilepath);
};

/**
 * Transform the openpgp files.
 * @param {Array} mainFiles
 * @param {Array} workerFiles
 * @param {boolean} hash
 * @returns {{mainFiles: Array, workerFiles: Array}}
 */
const transformOpenpgpFiles = (mainFiles, workerFiles, hash) => {
    // Transform the openpgp files.
    const transformedMainFiles = mainFiles.map((filepath) =>
        transformFile({
            filepath: path.resolve(filepath),
            hash,
            transformPath
        })
    );

    // Then transform the worker files and replace the reference.
    const transformedWorkerFiles = workerFiles.map((filepath, i) =>
        transformFile({
            filepath: path.resolve(filepath),
            hash,
            transform(filepath, contents) {
                return transformWorkerContents(contents, transformedMainFiles[i].filepath);
            },
            transformPath
        })
    );

    return {
        mainFiles: transformedMainFiles,
        workerFiles: transformedWorkerFiles
    };
};

module.exports = transformOpenpgpFiles;
