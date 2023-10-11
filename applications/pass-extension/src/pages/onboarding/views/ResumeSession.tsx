import { type VFC, useEffect } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { createApi } from '@proton/pass/lib/api/create-api';
import type { ExtensionPersistedSession } from '@proton/pass/lib/auth/session';
import { resumeSession } from '@proton/pass/lib/auth/session';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { browserLocalStorage } from '@proton/pass/lib/extension/storage';
import type { StorageInterface } from '@proton/pass/lib/extension/storage/types';
import browser from '@proton/pass/lib/globals/browser';
import type { LocalStoreData } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import * as config from '../../../app/config';

/* Temporary extension page to resume a session on start-up.
 * In the startup event listener - when the extension's target API
 * is set to staging - there seems to be an error during the initial SSL
 * handshake (net:ERR_SSL_CLIENT_AUTH_CERT_NEEDED)
 * Mimics the authService::resumeSession data flow */
const tryResumeSession = async () => {
    const tab = await browser.tabs.getCurrent().catch(noop);
    const tabId = tab?.id;
    const localStore = browserLocalStorage as StorageInterface<LocalStoreData>;

    if (!tab || !tabId) return;

    try {
        const ps = await localStore.getItem('ps');

        if (ps) {
            const persistedSession = JSON.parse(ps) as ExtensionPersistedSession;
            const api = createApi({
                config,
                auth: {
                    UID: persistedSession.UID,
                    AccessToken: persistedSession.AccessToken,
                    RefreshToken: persistedSession.RefreshToken,
                },
                onSessionRefresh: async ({ AccessToken, RefreshToken }, RefreshTime) => {
                    const updatedPS = { ...persistedSession, AccessToken, RefreshToken, RefreshTime };
                    await browserLocalStorage.setItem('ps', JSON.stringify(updatedPS));
                },
            });

            const session = await resumeSession({
                api,
                session: persistedSession,
                onInvalidSession: () => browserLocalStorage.removeItem('ps'),
            });

            if (session !== undefined) {
                await sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.SESSION_RESUMED,
                        payload: session,
                    })
                );
            }
        }
    } finally {
        void browser.tabs.remove(tabId);
    }
};

export const ResumeSession: VFC = () => {
    useEffect(() => {
        tryResumeSession().catch(logger.warn);
    }, []);

    return (
        <div className="pass-lobby" style={{ height: '100vh' }}>
            <main className="ui-standard w-full relative sign-layout shadow-lifted mw30r max-w-full flex mx-auto rounded-lg">
                <div className="flex p-14 w-full flex-column flex-align-items-center">
                    <h3 className="mb-4">Signing you back in</h3>
                    <CircleLoader size="large" className="color-primary mb-2" />
                    <em>Don't close this tab</em>
                </div>
            </main>
        </div>
    );
};
