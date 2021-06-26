/**
 * Escape a string for a regex. NOTE: Does not cover all cases. Just the ones we expect.
 * @param {string} str
 * @return {string}
 */
const escapeRegex = str => str.replace(/[-.]/g, "\\$&");

/**
 * Transform an array of strings into a regex catch.
 * @param {Array} arr
 * @return {string}
 */
const transform = (arr = []) => {
  return arr.map(escapeRegex).join("|");
};

/**
 * Exclude all node modules, EXCEPT the node modules specified.
 * Also exclude any specified files.
 * @param {Array} nodeModules
 * @param {Array} files
 * @return {RegExp}
 */
module.exports = (nodeModules = [], files = []) =>
  new RegExp(
    `(/node_modules/(?!(${transform(nodeModules)})))|(${transform(files)})`
  );
