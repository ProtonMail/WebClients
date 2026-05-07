import type { Session } from 'electron';

import { UpdateStatus } from '@proton/pass/types/desktop';
import { logger } from '@proton/pass/utils/logger';

import { setUpdateStore } from './store';
import type { RemoteManifestResponse } from './updater';

const FAKE_MANIFEST: RemoteManifestResponse = {
    Releases: [
        { Version: '99.9.0', RolloutPercentage: 1, CategoryName: 'Beta' },
        { Version: '99.0.0', RolloutPercentage: 0.42, CategoryName: 'Stable' },
    ],
};

export const setupUpdaterMock = (session: Session) => {
    const originalFetch = session.fetch.bind(session);
    (session as any).fetch = (input: Parameters<typeof session.fetch>[0], init?: RequestInit) => {
        if (typeof input === 'string' && input.endsWith('/version.json')) {
            return Promise.resolve(
                new Response(JSON.stringify(FAKE_MANIFEST), {
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        }
        return originalFetch(input, init);
    };
};

export const fakeDownload = async (newVersion: string) => {
    logger.log(`[Update] Unpacked app short-circuit triggered as non prod env`);
    setUpdateStore({ status: UpdateStatus.Downloading, progress: 0, newVersion });
    for (let i = 0; i <= 100; i += 10) {
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
        setUpdateStore({ progress: i });
    }
    setUpdateStore({ status: UpdateStatus.UpdateReady, progress: null });
    return true;
};
