/**
 * @jest-environment-options {"abortSignal": true}
 */
import { PassCrypto } from '@proton/pass/lib/crypto';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { itemCreate } from '@proton/pass/store/actions/creators/item';
import { selectItemWithOptimistic } from '@proton/pass/store/selectors/items';
import type { ItemCreateRequest } from '@proton/pass/types/api/pass';
import type { ItemCreateIntent } from '@proton/pass/types/data/items.dto';
import { AppStatus } from '@proton/pass/types/worker/state';
import {
    BACKEND_FAILURES,
    createTestBackend,
    getSessionResumeHandlers,
    respond,
} from '@proton/pass/utils/tests/backend';
import { createTestCache, hydrateTestPassCrypto } from '@proton/pass/utils/tests/fixtures/cache';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/utils/tests/fixtures/crypto';
import type { TestPersistedSession } from '@proton/pass/utils/tests/fixtures/session';
import {
    createTestOfflineComponents,
    createTestPersistedSession,
    createTestSession,
} from '@proton/pass/utils/tests/fixtures/session';
import { RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';

import { setupAuthWorker } from './auth';

jest.mock('../app/worker/channel');

const OPTIMISTIC_ID = 'optimistic-login';

describe('Item writes on a booted worker', () => {
    const backend = createTestBackend();
    let persisted: TestPersistedSession;
    let cache: Awaited<ReturnType<typeof createTestCache>>;

    const itemRoute = () => `pass/v1/share/${cache.vault.shareId}/item`;

    const createIntent = (): ItemCreateIntent<'login'> => ({
        ...itemBuilder('login').set('metadata', (metadata) => metadata.set('name', 'Github')).data,
        optimisticId: OPTIMISTIC_ID,
        shareId: cache.vault.shareId,
        files: { toAdd: [], toRemove: [] },
        extraData: { withAlias: false },
        folderId: null,
    });

    /** Healthy start: the real store boots online from the cache */
    const setupBooted = async () => {
        const worker = setupAuthWorker(persisted, { cache: cache.encrypted });
        backend.use(...getSessionResumeHandlers(persisted));
        await worker.start();
        await worker.bootSettled();
        expect(worker.ctx.status).toBe(AppStatus.READY);
        return worker;
    };

    /** Echoes the encrypted item of the request, as the backend returns the created revision */
    const acceptItemCreation: Parameters<typeof backend.on>[2] = async ({ request }) => {
        const { Content, ItemKey, KeyRotation, ContentFormatVersion } = (await request.json()) as ItemCreateRequest;
        const now = Math.floor(Date.now() / 1000);

        return respond.ok({
            Item: {
                ItemID: 'server-item-id',
                Revision: 1,
                ContentFormatVersion,
                Flags: 0,
                KeyRotation,
                Content,
                ItemKey,
                State: 1,
                Pinned: false,
                ShareCount: 0,
                CreateTime: now,
                ModifyTime: now,
                RevisionTime: now,
                LastUseTime: null,
            },
        });
    };

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        const cryptoUser = await hydrateTestPassCrypto();
        const offline = await createTestOfflineComponents();

        cache = await createTestCache({
            cryptoUser,
            offlineKD: offline.offlineKD,
            logins: [{ name: 'Bank', password: 'bank-pass' }],
        });

        persisted = await createTestPersistedSession(
            createTestSession({ ...offline, keyPassword: cryptoUser.keyPassword })
        );

        PassCrypto.clear();
    });

    afterAll(releaseCryptoProxy);

    let clock = Date.now();

    beforeEach(() => jest.useFakeTimers({ now: clock, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));

    afterEach(() => {
        clock = Date.now();
        jest.useRealTimers();
    });

    test.each(BACKEND_FAILURES)(
        'a creation answered with $label stays as a failed item, the session is kept',
        async (failure) => {
            const { ctx, settleUntil, getPersistedSession } = await setupBooted();
            const persistedBefore = await getPersistedSession();
            backend.on('post', itemRoute(), failure.respond);

            const select = selectItemWithOptimistic(cache.vault.shareId, OPTIMISTIC_ID);
            ctx.service.store.dispatch(itemCreate.intent(createIntent()));
            await settleUntil(() => select(ctx.service.store.getState())?.failed === true);

            expect(select(ctx.service.store.getState())).toMatchObject({ failed: true, optimistic: true });
            expect(backend.countRequests(itemRoute())).toBeGreaterThan(0);
            expect(backend.countRequests(itemRoute())).toBeLessThanOrEqual(RETRY_ATTEMPTS_MAX);
            expect(ctx.status).toBe(AppStatus.READY);
            expect(await getPersistedSession()).toEqual(persistedBefore);
        }
    );

    test('retrying a failed creation once the backend is back stores the item under its server id', async () => {
        const { ctx, settleUntil } = await setupBooted();
        const { store } = ctx.service;
        backend.on('post', itemRoute(), () => respond.error(503));

        const select = selectItemWithOptimistic(cache.vault.shareId, OPTIMISTIC_ID);
        store.dispatch(itemCreate.intent(createIntent()));
        await settleUntil(() => select(store.getState())?.failed === true);

        backend.reset();
        backend.use(...getSessionResumeHandlers(persisted));
        backend.on('post', itemRoute(), acceptItemCreation);
        store.dispatch(itemCreate.intent(createIntent()));
        await settleUntil(() => select(store.getState()) === undefined);

        const created = selectItemWithOptimistic(cache.vault.shareId, 'server-item-id')(store.getState());
        expect(created).toMatchObject({ failed: false, optimistic: false, data: { metadata: { name: 'Github' } } });
        expect(ctx.status).toBe(AppStatus.READY);
    });
});
