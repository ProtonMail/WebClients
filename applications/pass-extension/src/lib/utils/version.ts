import browser from '@proton/pass/lib/globals/browser';

/** Version for the current build */
export const EXTENSION_BUILD_VERSION = VERSION;

/** Returns the version specific in the manifest.
 * In case the `browser` API call fails, returns
 * the `EXTENSION_BUILD_VERSION` */
export const EXTENSION_MANIFEST_VERSION = (() => {
    try {
        return browser.runtime.getManifest().version;
    } catch {
        void browser.runtime.lastError;
        return EXTENSION_BUILD_VERSION;
    }
})();

/** If we have a mismatch between the build version and the manifest
 * version in Chrome, this can only mean there was a rollback since
 * Chrome increases the version number on rollbacks. For example:
 * Rolling back from `1.25.0` to 1.24.1` will effectively create a new
 * `1.25.1` manifest version while serving the `1.24.1` build */
export const EXTENSION_ROLLBACKED = BUILD_TARGET === 'chrome' && EXTENSION_BUILD_VERSION !== EXTENSION_MANIFEST_VERSION;
