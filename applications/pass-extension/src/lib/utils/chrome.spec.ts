import * as versionModule from 'proton-pass-extension/lib/utils/version';

import { isChromeExtensionRollback } from './chrome';

const version = versionModule as MockVersionModule;

type MockVersionModule = typeof versionModule & {
    setBuildVersion: (version: string) => void;
    setManifestVersion: (version: string) => void;
};

jest.mock('proton-pass-extension/lib/utils/version', (): MockVersionModule => {
    const module = {
        get EXTENSION_BUILD_VERSION() {
            return module._MOCK_EXTENSION_BUILD_VERSION_;
        },
        get EXTENSION_MANIFEST_VERSION() {
            return module._MOCK_EXTENSION_MANIFEST_VERSION_;
        },

        _MOCK_EXTENSION_BUILD_VERSION_: '1.0.0',
        _MOCK_EXTENSION_MANIFEST_VERSION_: '1.0.0',

        setBuildVersion(version: string) {
            module._MOCK_EXTENSION_BUILD_VERSION_ = version;
        },
        setManifestVersion(version: string) {
            module._MOCK_EXTENSION_MANIFEST_VERSION_ = version;
        },
    };

    return module;
});
const setBuildTarget = (value: string) => ((global as any).BUILD_TARGET = value);

describe('isChromeExtensionRollback', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('should return `false` when `BUILD_TARGET` is not "chrome"', () => {
        setBuildTarget('firefox');
        expect(isChromeExtensionRollback()).toBe(false);
    });

    test('should return `false` when versions match', () => {
        setBuildTarget('chrome');
        version.setBuildVersion('1.0.0');
        version.setManifestVersion('1.0.0');
        expect(isChromeExtensionRollback()).toBe(false);
    });

    test('should return `true` when build/manifest versions mismatch', () => {
        /* simulates a chrome rollback by increasing the manifest version
         * eg: rolling back from 1.0.1 to 1.0.0 would set manifest to 1.0.2 */
        setBuildTarget('chrome');
        version.setBuildVersion('1.0.0');
        version.setManifestVersion('1.0.2');
        expect(isChromeExtensionRollback()).toBe(true);
    });
});
