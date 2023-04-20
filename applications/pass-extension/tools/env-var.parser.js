/**
 * This utility will get rid of most
 * false positives when parsing env
 * variables.
 */
module.exports = (envVar, fallback, mapTo = (x) => x) => {
    try {
        return mapTo(JSON.parse(JSON.stringify(process.env[envVar])));
    } catch (e) {
        return fallback;
    }
};
