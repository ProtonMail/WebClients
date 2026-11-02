import { Blob as NodeBlob } from 'buffer';
import { IDBFactory } from 'fake-indexeddb';

import { TEST_API_URL } from '@proton/pass/utils/tests/backend';
import type { createTestCache } from '@proton/pass/utils/tests/fixtures/cache';
import type { TestPersistedSession } from '@proton/pass/utils/tests/fixtures/session';
import { mockAppStyles, mockLayout } from '@proton/pass/utils/tests/layout';
import noop from '@proton/utils/noop';

type RenderAppOptions = {
    persisted: TestPersistedSession;
    cache: Awaited<ReturnType<typeof createTestCache>>;
    /** Runs the app as the desktop build: `DESKTOP_BUILD` and a `window.ctxBridge` */
    desktop?: boolean;
};

/** `DESKTOP_BUILD` is a build-time constant: the jest globals make it a writable global */
const setDesktopBuild = (value: boolean) => ((globalThis as { DESKTOP_BUILD?: boolean }).DESKTOP_BUILD = value);

let unmount: () => void = noop;

/** Unmounts the app of the current test. Call it in `afterEach`: the testing library
 * loaded for the app is not the one of the spec, its automatic cleanup is off. */
export const unmountApp = () => {
    unmount();
    unmount = noop;
    setDesktopBuild(false);
    delete window.ctxBridge;
};

/** Desktop bridge exposed by the Electron preload script. Methods the tests do not drive
 * resolve to nothing, `on*` subscriptions return their unsubscribe function. */
const createTestBridge = (onSystemWake: (callback: () => void) => void) =>
    new Proxy({} as NonNullable<Window['ctxBridge']>, {
        get: (_, name: string) => {
            if (name === 'onSystemWake') {
                return (callback: () => void) => {
                    onSystemWake(callback);
                    return noop;
                };
            }

            if (name === 'sshAgent') return new Proxy({}, { get: () => async () => undefined });
            return name.startsWith('on') ? () => noop : async () => undefined;
        },
    });

/** Mounts the real web app (`App.tsx`) over the test backend, a persisted session in `localStorage`
 * and an encrypted cache in IndexedDB.
 *
 * The app builds its singletons (API, connectivity, stores, crypto) when its modules load: each call
 * loads a fresh copy of them, so tests do not share state. The crypto proxy is set up again for that copy. */
export const renderApp = async ({ persisted, cache, desktop = false }: RenderAppOptions) => {
    let wake: () => void = noop;
    setDesktopBuild(desktop);
    if (desktop) window.ctxBridge = createTestBridge((callback) => (wake = callback));

    Object.assign(process.env, {
        API_URL: TEST_API_URL,
        APP_NAME: 'proton-pass',
        APP_VERSION: '1.0.0',
        SSO_URL: 'https://account.test',
        RTL_SKIP_AUTO_CLEANUP: 'true',
    });

    /** `fake-indexeddb` clones values with the Node `structuredClone`, which turns a jsdom `Blob`
     * into an empty object: the cache blobs written by the app would be read back empty */
    globalThis.Blob = NodeBlob as typeof Blob;
    globalThis.indexedDB = new IDBFactory();

    mockLayout();
    mockAppStyles();

    localStorage.clear();
    localStorage.setItem('ps-0', persisted.encrypted);
    window.history.pushState({}, '', '/u/0');

    await jest.isolateModulesAsync(async () => {
        const { setupCryptoProxyForTesting } = await import('@proton/pass/utils/tests/fixtures/crypto');
        const { loadCryptoWorker } = await import('@proton/shared/lib/helpers/setupCryptoWorker');
        const { writeDBCache } = await import('proton-pass-web/lib/database');
        const { render } = await import('@testing-library/react');

        await setupCryptoProxyForTesting();
        jest.mocked(loadCryptoWorker).mockResolvedValue(undefined);
        await writeDBCache(persisted.session.UserID, cache.encrypted, '1.0.0');

        const { App } = await import('proton-pass-web/app/App');
        unmount = render(<App />).unmount;
    });

    /** What the Electron main process sends when the system resumes or the screen unlocks */
    return { systemWake: () => wake() };
};
