import { EXTENSION_BUILD_VERSION, EXTENSION_MANIFEST_VERSION } from 'proton-pass-extension/lib/utils/version';

/** If we have a mismatch between the build version and the manifest
 * version in Chrome, this can only mean there was a rollback since
 * Chrome increases the version number on rollbacks. For example:
 * Rolling back from `1.25.0` to 1.24.1` will effectively create a new
 * `1.25.1` manifest version while serving the `1.24.1` build */
export const isChromeExtensionRollback = (): boolean =>
    BUILD_TARGET === 'chrome' && EXTENSION_BUILD_VERSION !== EXTENSION_MANIFEST_VERSION;

export const checkChromeRuntimeError = () => {
    void chrome?.runtime?.lastError;
};
