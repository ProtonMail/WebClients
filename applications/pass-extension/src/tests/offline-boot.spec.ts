/**
 * @jest-environment-options {"abortSignal": true}
 */
import { PassCrypto } from '@proton/pass/lib/crypto';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { AppStatus } from '@proton/pass/types/worker/state';
import { createTestBackend, getSessionResumeHandlers, respond } from '@proton/pass/utils/tests/backend';
import { createTestCache, hydrateTestPassCrypto } from '@proton/pass/utils/tests/fixtures/cache';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/utils/tests/fixtures/crypto';
import type { TestPersistedSession } from '@proton/pass/utils/tests/fixtures/session';
import {
    TEST_OFFLINE_PASSWORD,
    createTestOfflineComponents,
    createTestPersistedSession,
    createTestSession,
} from '@proton/pass/utils/tests/fixtures/session';

import { SESSION_RESUME_ALARM } from '../app/worker/services/auth/auth.alarms';
import { setupAuthWorker } from './auth';

jest.mock('../app/worker/channel');

describe('Offline boot on the real worker store', () => {
    const backend = createTestBackend();
    let persisted: TestPersistedSession;
    let cache: Awaited<ReturnType<typeof createTestCache>>;
    let otherKeyCache: EncryptedPassCache;

    /** Backend down at start: the worker asks for the offline unlock, the user types the password */
    const setupOutage = async (workerCache: EncryptedPassCache = cache.encrypted) => {
        const worker = setupAuthWorker(persisted, { cache: workerCache });
        backend.use(...getSessionResumeHandlers(persisted));
        backend.on('get', 'core/v4/users', () => respond.error(503));
        await worker.start();
        return worker;
    };

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        const cryptoUser = await hydrateTestPassCrypto();
        const offline = await createTestOfflineComponents();
        const otherOffline = await createTestOfflineComponents('other-offline-password');
        const logins = [{ name: 'Bank', password: 'bank-pass' }];

        cache = await createTestCache({ cryptoUser, offlineKD: offline.offlineKD, logins });
        otherKeyCache = (await createTestCache({ cryptoUser, offlineKD: otherOffline.offlineKD, logins })).encrypted;

        persisted = await createTestPersistedSession(
            createTestSession({ ...offline, keyPassword: cryptoUser.keyPassword })
        );

        /** Building the caches hydrated `PassCrypto`: a worker starts with it empty */
        PassCrypto.clear();
    });

    afterAll(releaseCryptoProxy);

    let clock = Date.now();

    beforeEach(() => jest.useFakeTimers({ now: clock, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));

    afterEach(() => {
        clock = Date.now();
        jest.useRealTimers();
    });

    test('the offline password boots offline with the cached vault and items', async () => {
        const { ctx, unlock, bootSettled } = await setupOutage();

        await unlock(TEST_OFFLINE_PASSWORD);
        await bootSettled();

        expect(ctx.status).toBe(AppStatus.OFFLINE);
        expect(ctx.booted).toBe(true);
        expect(PassCrypto.ready).toBe(false);
        expect(backend.requests.filter((request) => request.startsWith('pass/'))).toEqual([]);

        const state = ctx.service.store.getState();
        const { vault } = cache;
        expect(state.shares[vault.shareId]).toMatchObject({ shareId: vault.shareId, content: { name: 'Personal' } });

        const [login] = cache.items;
        expect(deobfuscateItem(state.items.byShareId[vault.shareId][login.itemId].data)).toMatchObject({
            metadata: { name: 'Bank' },
            content: { password: 'bank-pass' },
        });
    });

    test('the backend coming back resumes online from the offline boot, keeping the cached data', async () => {
        const { alarms, ctx, start, unlock, bootSettled, settleUntil } = setupAuthWorker(persisted, {
            cache: cache.encrypted,
        });
        backend.on('all', '*', () => respond.error(503));
        await start();
        await unlock(TEST_OFFLINE_PASSWORD);
        await bootSettled();
        expect(ctx.status).toBe(AppStatus.OFFLINE);
        expect(PassCrypto.ready).toBe(false);

        backend.reset();
        backend.use(...getSessionResumeHandlers(persisted));
        await jest.advanceTimersByTimeAsync(120_000);
        await alarms.fire(SESSION_RESUME_ALARM);
        await settleUntil(() => PassCrypto.ready);

        expect(PassCrypto.ready).toBe(true);
        expect(PassCrypto.getShareManager(cache.vault.shareId).hasVaultShareKey(1)).toBe(true);

        const [login] = cache.items;
        const item = ctx.service.store.getState().items.byShareId[cache.vault.shareId][login.itemId];
        expect(deobfuscateItem(item.data)).toMatchObject({ content: { password: 'bank-pass' } });
        expect(ctx.status).toBe(AppStatus.READY);
    });

    describe('unreadable cache', () => {
        test.each([
            { label: 'missing', workerCache: {} },
            { label: 'encrypted for another offline password', workerCache: () => otherKeyCache },
        ])('$label fails the boot without wiping the session', async ({ workerCache }) => {
            const { ctx, getPersistedSession, unlock, bootSettled } = await setupOutage(
                typeof workerCache === 'function' ? workerCache() : workerCache
            );

            await unlock(TEST_OFFLINE_PASSWORD);
            await bootSettled();

            expect(ctx.status).toBe(AppStatus.ERROR);
            expect(ctx.booted).toBe(false);
            expect(ctx.service.store.getState().shares).toEqual({});
            expect(await getPersistedSession()).toMatchObject({ offlineVerifier: persisted.session.offlineVerifier });
        });
    });
});
