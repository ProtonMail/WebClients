/**
 * This utility will get rid of most
 * false positives when parsing env
 * variables.
 */
const parseEnvVar = (envVar, fallback, mapTo = (x) => x) => {
    try {
        return mapTo(JSON.parse(JSON.stringify(process.env[envVar])));
    } catch (e) {
        return fallback;
    }
};

const parseBool = (x) => x === 'true' || x === '1' || x === 1;

const RUNTIME_RELOAD = parseEnvVar('RUNTIME_RELOAD', false, parseBool);

const BUILD_TARGET = parseEnvVar('BUILD_TARGET', 'chrome', String);
const CLEAN_MANIFEST = parseEnvVar('CLEAN_MANIFEST', false, parseBool);
const ENV = parseEnvVar('NODE_ENV', 'development', String);
const HOT_MANIFEST_UPDATE = RUNTIME_RELOAD && parseEnvVar('HOT_MANIFEST_UPDATE', false, parseBool);
const REDUX_DEVTOOLS_PORT = parseEnvVar('REDUX_DEVTOOLS_PORT', 8000, parseInt);
const RESUME_FALLBACK = parseEnvVar('RESUME_FALLBACK', false, parseBool);
const RUNTIME_RELOAD_PORT = parseEnvVar('RUNTIME_RELOAD_PORT', 8089, parseInt);
const WEBPACK_DEV_PORT = parseEnvVar('WEBPACK_DEV_PORT', 8090, Number);

module.exports = {
    BUILD_TARGET,
    CLEAN_MANIFEST,
    ENV,
    HOT_MANIFEST_UPDATE,
    REDUX_DEVTOOLS_PORT,
    RESUME_FALLBACK,
    RUNTIME_RELOAD_PORT,
    RUNTIME_RELOAD,
    WEBPACK_DEV_PORT,
};
