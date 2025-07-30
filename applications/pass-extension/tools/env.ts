/**
 * This utility will get rid of most
 * false positives when parsing env
 * variables.
 */
const parseEnvVar = <T extends unknown = string>(envVar: string, fallback: T, mapTo = (x: string): T => x as T) => {
    try {
        return mapTo(JSON.parse(JSON.stringify(process.env[envVar])));
    } catch (e) {
        return fallback;
    }
};

const parseBool = (x: unknown) => x === 'true' || x === '1' || x === 1;

const BETA = parseEnvVar('BETA', false, Boolean);
const BUILD_TARGET = parseEnvVar('BUILD_TARGET', 'chrome', String);
const BUILD_STORE_TARGET = parseEnvVar('BUILD_STORE_TARGET', '', String);
const CLEAN_MANIFEST = parseEnvVar('CLEAN_MANIFEST', false, parseBool);
const ENV = parseEnvVar('NODE_ENV', 'development', String);
const HTTP_DEBUGGER = parseEnvVar('HTTP_DEBUGGER', false, parseBool);
const HTTP_DEBUGGER_PORT = parseEnvVar('HTTP_DEBUGGER_PORT', 3000, Number);
const MANIFEST_KEY = parseEnvVar('MANIFEST_KEY', BUILD_TARGET === 'chrome' ? 'chrome:production' : '', String);
const REDUX_DEVTOOLS_PORT = parseEnvVar('REDUX_DEVTOOLS_PORT', 8000, parseInt);
const RELEASE = parseEnvVar('RELEASE', false, parseBool);
const RESUME_FALLBACK = parseEnvVar('RESUME_FALLBACK', false, parseBool);
const RUNTIME_RELOAD = parseEnvVar('RUNTIME_RELOAD', false, parseBool);
const RUNTIME_RELOAD_PORT = parseEnvVar('RUNTIME_RELOAD_PORT', 8089, parseInt);
const WEBPACK_CIRCULAR_DEPS = parseEnvVar('WEBPACK_CIRCULAR_DEPS', false, Boolean);
const WEBPACK_DEV_PORT = parseEnvVar('WEBPACK_DEV_PORT', 8090, Number);

const HOT_MANIFEST_UPDATE = RUNTIME_RELOAD && parseEnvVar('HOT_MANIFEST_UPDATE', false, parseBool);

export default {
    BETA,
    BUILD_TARGET,
    BUILD_STORE_TARGET,
    CLEAN_MANIFEST,
    ENV,
    HOT_MANIFEST_UPDATE,
    HTTP_DEBUGGER_PORT,
    HTTP_DEBUGGER,
    MANIFEST_KEY,
    REDUX_DEVTOOLS_PORT,
    RELEASE,
    RESUME_FALLBACK,
    RUNTIME_RELOAD_PORT,
    RUNTIME_RELOAD,
    WEBPACK_CIRCULAR_DEPS,
    WEBPACK_DEV_PORT,
};
