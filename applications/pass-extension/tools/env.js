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

const BUILD_TARGET = parseEnvVar('BUILD_TARGET', 'chrome', String);
const CLEAN_MANIFEST = parseEnvVar('CLEAN_MANIFEST', false, parseBool);
const ENV = parseEnvVar('NODE_ENV', 'development', String);
const MANIFEST_KEY = parseEnvVar('MANIFEST_KEY', BUILD_TARGET === 'chrome' ? 'chrome:production' : '', String);
const REDUX_DEVTOOLS_PORT = parseEnvVar('REDUX_DEVTOOLS_PORT', 8000, parseInt);
const RELEASE = parseEnvVar('RELEASE', false, parseBool);
const RESUME_FALLBACK = parseEnvVar('RESUME_FALLBACK', false, parseBool);
const RUNTIME_RELOAD = parseEnvVar('RUNTIME_RELOAD', false, parseBool);
const RUNTIME_RELOAD_PORT = parseEnvVar('RUNTIME_RELOAD_PORT', 8089, parseInt);
const WEBPACK_DEV_PORT = parseEnvVar('WEBPACK_DEV_PORT', 8090, Number);
const WEBPACK_CIRCULAR_DEPS = parseEnvVar('WEBPACK_CIRCULAR_DEPS', false, Boolean);

const HOT_MANIFEST_UPDATE = RUNTIME_RELOAD && parseEnvVar('HOT_MANIFEST_UPDATE', false, parseBool);

module.exports = {
    BUILD_TARGET,
    CLEAN_MANIFEST,
    ENV,
    HOT_MANIFEST_UPDATE,
    MANIFEST_KEY,
    REDUX_DEVTOOLS_PORT,
    RELEASE,
    RESUME_FALLBACK,
    RUNTIME_RELOAD_PORT,
    RUNTIME_RELOAD,
    WEBPACK_DEV_PORT,
    WEBPACK_CIRCULAR_DEPS,
};
