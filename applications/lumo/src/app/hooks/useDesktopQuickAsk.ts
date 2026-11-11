import { useEffect, useState } from 'react';

import { QUICK_ASK_PARAM, takeDesktopQuickAsk } from '@proton/lumo-api-client/core/desktop-quick-ask';
import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';

import { useQueryParam } from './useQueryParam';

/**
 * Question sent from the Lumo Desktop quick-ask shortcut, to auto-send like a guest `?q=`.
 *
 * The shell navigates to `#quickask=<nonce>` and keeps the question itself; this hook trades the
 * nonce for it through the desktop bridge. Outside the desktop app the marker is stripped and
 * ignored. Like `useQueryParam`, the value lasts until the next navigation.
 */
export const useDesktopQuickAsk = (): string | null => {
    const nonce = useQueryParam(QUICK_ASK_PARAM, true, 'hash', isDesktopEnvironment());
    const [taken, setTaken] = useState<{ nonce: string; query: string } | null>(null);

    useEffect(() => {
        if (!nonce) {
            return;
        }
        let active = true;
        // Memoised per nonce, so the remount of React StrictMode still receives the question.
        void takeDesktopQuickAsk(nonce).then((query) => {
            if (active) {
                setTaken(query ? { nonce, query } : null);
            }
        });
        return () => {
            active = false;
        };
    }, [nonce]);

    return taken && taken.nonce === nonce ? taken.query : null;
};
