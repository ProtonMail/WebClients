/**
 * @jest-environment-options {"abortSignal": true}
 */
import { screen, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';

import { findOfflinePasswordPrompt, itemList, unlockWithPassword } from '@proton/pass/utils/tests/actions';
import { createTestBackend, getSessionResumeHandlers, respond } from '@proton/pass/utils/tests/backend';
import { createTestCache, hydrateTestPassCrypto } from '@proton/pass/utils/tests/fixtures/cache';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/utils/tests/fixtures/crypto';
import {
    TEST_OFFLINE_PASSWORD,
    createTestOfflineComponents,
    createTestPersistedSession,
    createTestSession,
} from '@proton/pass/utils/tests/fixtures/session';

import { renderApp, unmountApp } from './render.app';

jest.setTimeout(90_000);

const UNLOCK_PROMPT = /Unlock .* with your .* password/;

describe('Backend outage at start', () => {
    const backend = createTestBackend();

    beforeAll(() => setupCryptoProxyForTesting());
    afterAll(releaseCryptoProxy);
    afterEach(unmountApp);

    const setup = async () => {
        const cryptoUser = await hydrateTestPassCrypto();
        const offline = await createTestOfflineComponents();
        const cache = await createTestCache({
            cryptoUser,
            offlineKD: offline.offlineKD,
            logins: [{ name: 'Bank', password: 'bank-pass' }],
        });
        const persisted = await createTestPersistedSession(
            createTestSession({ ...offline, keyPassword: cryptoUser.keyPassword, LocalID: 0 })
        );

        backend.use(...getSessionResumeHandlers(persisted));
        return { cache, persisted };
    };

    const expectCachedItems = () =>
        waitFor(() => expect(itemList().getByText('Bank')).toBeInTheDocument(), { timeout: 30_000 });

    test('asks for the offline password, then lists the cached items', async () => {
        const { cache, persisted } = await setup();
        backend.on('all', '*', () => respond.error(503));
        await renderApp({ persisted, cache });

        const submit = await findOfflinePasswordPrompt();
        await unlockWithPassword(TEST_OFFLINE_PASSWORD, submit);

        await expectCachedItems();
        expect(screen.queryByText(UNLOCK_PROMPT)).not.toBeInTheDocument();
    });

    test('a healthy backend lists the cached items without any prompt', async () => {
        const { cache, persisted } = await setup();
        await renderApp({ persisted, cache });

        await expectCachedItems();
        expect(screen.queryByText(UNLOCK_PROMPT)).not.toBeInTheDocument();
    });

    describe('desktop', () => {
        beforeEach(() => jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));
        afterEach(() => jest.useRealTimers());

        /** Fake timers are never advanced: the connectivity retry loop cannot resume the app
         * by itself, only the system wake can */
        test('a system wake resumes online from the offline boot once the backend is back', async () => {
            const { cache, persisted } = await setup();
            backend.on('all', '*', () => respond.error(503));
            const { systemWake } = await renderApp({ persisted, cache, desktop: true });

            await unlockWithPassword(TEST_OFFLINE_PASSWORD, await findOfflinePasswordPrompt());
            await screen.findByText('Offline mode', undefined, { timeout: 30_000 });
            await expectCachedItems();

            backend.reset();
            backend.use(...getSessionResumeHandlers(persisted));
            systemWake();

            /** Shorter than the first connectivity retry (5s): a resume in this window is the wake */
            await waitFor(() => expect(screen.queryByText('Offline mode')).not.toBeInTheDocument(), {
                timeout: 2_000,
            });
            expect(itemList().getByText('Bank')).toBeInTheDocument();
            expect(backend.countRequests('auth/v4/sessions/local/key')).toBeGreaterThan(0);
        });
    });

    describe('while the app is open', () => {
        beforeEach(() => jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));
        afterEach(() => jest.useRealTimers());

        const expectSessionKept = () => {
            expect(localStorage.getItem('ps-0')).not.toBeNull();
            expect(itemList().getByText('Bank')).toBeInTheDocument();
            expect(screen.queryByText(UNLOCK_PROMPT)).not.toBeInTheDocument();
        };

        test('servers going down keep the session and the items, with a warning', async () => {
            const { cache, persisted } = await setup();
            await renderApp({ persisted, cache });
            await expectCachedItems();

            backend.on('all', '*', () => respond.error(503));
            await screen.findByText('Servers are unreachable', undefined, { timeout: 180_000 });

            expectSessionKept();
        });

        test('the device going offline keeps the session and the items, and recovers when back', async () => {
            const { cache, persisted } = await setup();
            await renderApp({ persisted, cache });
            await expectCachedItems();

            const setNavigatorOnline = (online: boolean) => {
                Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
                window.dispatchEvent(new Event(online ? 'online' : 'offline'));
            };

            setNavigatorOnline(false);
            await screen.findByText('No network connection', undefined, { timeout: 30_000 });
            expectSessionKept();

            setNavigatorOnline(true);
            await waitFor(() => expect(screen.queryByText('No network connection')).not.toBeInTheDocument(), {
                timeout: 30_000,
            });
            expectSessionKept();
        });
    });
});
