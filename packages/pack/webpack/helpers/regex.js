/**
 * Escape a string for a regex. NOTE: Does not cover all cases. Just the ones we expect.
 * @param {string} str
 * @return {string}
 */
const escapeRegex = (str) => str.replace(/[-.]/g, '\\$&');

/**
 * Transform an array of strings into a regex catch.
 * @param {Array} arr
 * @return {string}
 */
const transform = (arr = []) => {
    return arr.map(escapeRegex).join('|');
};

/**
 * Exclude all node modules, EXCEPT the node modules specified.
 * pnpm stores packages at node_modules/.pnpm/<id>/node_modules/<name>, so the .pnpm segment is
 * skipped and the inner node_modules segment decides.
 * @param {Array} nodeModules
 * @return {String}
 */
const excludeNodeModulesExcept = (nodeModules = []) => `/node_modules/(?!(\\.pnpm/|${transform(nodeModules)}))`;

/**
 * Create a regex matching the strings in the array.
 * @param {Array} arr
 * @return {string}
 */
const excludeFiles = (arr = []) => `${transform(arr)}`;

/**
 * Create a regex out of regex-strings.
 * @param {Array} regexes
 * @return {RegExp}
 */
const createRegex = (...regexes) => new RegExp(`${regexes.join('|')}`);

module.exports = {
    excludeFiles,
    excludeNodeModulesExcept,
    createRegex,
};
