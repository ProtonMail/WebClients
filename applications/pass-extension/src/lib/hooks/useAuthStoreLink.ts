import { useEffect } from 'react';

import { SESSION_KEYS } from '@proton/pass/lib/auth/session';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import browser from '@proton/pass/lib/globals/browser';
import { logger } from '@proton/pass/utils/logger';

/** Synchronizes the UI's AuthStore with the service worker's session
 * state `using browser.storage.session` as a communication bridge. */
export const useAuthStoreLink = (authStore: AuthStore) => {
    useEffect(() => {
        const onSessionChanged = async () => {
            try {
                const session = await browser.storage.session.get(SESSION_KEYS);
                if (Object.keys(session).length === 0) authStore.clear();
                else authStore.setSession(session);
            } catch {
                logger.debug(`[ExtensionCore] failed syncing session change`);
            }
        };

        void onSessionChanged();
        browser.storage.session.onChanged.addListener(onSessionChanged);
        return () => browser.storage.session.onChanged.removeListener(onSessionChanged);
    }, []);
};
