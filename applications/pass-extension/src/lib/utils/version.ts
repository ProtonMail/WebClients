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
