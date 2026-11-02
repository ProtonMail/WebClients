/**
 * @jest-environment-options {"abortSignal": true}
 */
import { screen } from '@testing-library/react';

import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { AppStatus } from '@proton/pass/types/worker/state';
import { findOfflinePasswordPrompt } from '@proton/pass/utils/tests/actions';
import { createTestBackend, getSessionResumeHandlers, respond } from '@proton/pass/utils/tests/backend';
import { createTestCache, hydrateTestPassCrypto } from '@proton/pass/utils/tests/fixtures/cache';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/utils/tests/fixtures/crypto';
import {
    createTestOfflineComponents,
    createTestPersistedSession,
    createTestSession,
} from '@proton/pass/utils/tests/fixtures/session';
import { render } from '@proton/pass/utils/tests/render';

import { Lobby } from '../app/popup/Views/Lobby/Lobby';
import { setupAuthWorker } from './auth';

jest.mock('../app/worker/channel');
jest.mock('../lib/components/Extension/ExtensionClient', () => ({ useExtensionClient: () => ({ logout: jest.fn() }) }));
jest.mock('../lib/hooks/useRequestFork', () => ({ useRequestForkWithPermissions: () => jest.fn() }));

describe('Popup during a backend outage', () => {
    const backend = createTestBackend();

    beforeAll(() => setupCryptoProxyForTesting());
    afterAll(releaseCryptoProxy);

    let clock = Date.now();

    beforeEach(() => jest.useFakeTimers({ now: clock, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));

    afterEach(() => {
        clock = Date.now();
        jest.useRealTimers();
    });

    test('shows the offline password prompt when the worker starts during an outage', async () => {
        const cryptoUser = await hydrateTestPassCrypto();
        const offline = await createTestOfflineComponents();
        const cache = await createTestCache({ cryptoUser, offlineKD: offline.offlineKD });
        const persisted = await createTestPersistedSession(
            createTestSession({ ...offline, keyPassword: cryptoUser.keyPassword })
        );

        const worker = setupAuthWorker(persisted, { cache: cache.encrypted });
        backend.use(...getSessionResumeHandlers(persisted));
        backend.on('all', '*', () => respond.error(503));
        await worker.start();
        expect(worker.ctx.status).toBe(AppStatus.PASSWORD_LOCKED);

        render(
            <ConnectivityProvider service={worker.ctx.service.connectivity}>
                <Lobby />
            </ConnectivityProvider>,
            { authStore: worker.ctx.authStore, app: { status: worker.ctx.status, booted: false, authorized: false } }
        );

        expect(await findOfflinePasswordPrompt()).toBeInTheDocument();
        expect(screen.getByText('Servers are unreachable')).toBeInTheDocument();
    });
});
