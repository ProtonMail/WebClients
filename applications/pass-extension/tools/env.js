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

const ENV = parseEnvVar('NODE_ENV', 'development', String);
const BUILD_TARGET = parseEnvVar('BUILD_TARGET', 'chrome', String);

const RESUME_FALLBACK = parseEnvVar('RESUME_FALLBACK', false, Boolean);

const WEBPACK_DEV_PORT = parseEnvVar('WEBPACK_DEV_PORT', 8090, Number);
const REDUX_DEVTOOLS_PORT = parseEnvVar('REDUX_DEVTOOLS_PORT', 8000, parseInt);

const RUNTIME_RELOAD = parseEnvVar('RUNTIME_RELOAD', false, Boolean);
const RUNTIME_RELOAD_PORT = parseEnvVar('RUNTIME_RELOAD_PORT', 8080, parseInt);

const HOT_MANIFEST_UPDATE = RUNTIME_RELOAD && parseEnvVar('HOT_MANIFEST_UPDATE', false, Boolean);

module.exports = {
    ENV,
    BUILD_TARGET,
    RESUME_FALLBACK,
    REDUX_DEVTOOLS_PORT,
    WEBPACK_DEV_PORT,
    RUNTIME_RELOAD,
    RUNTIME_RELOAD_PORT,
    HOT_MANIFEST_UPDATE,
};
