import { useCallback } from 'react';

import browser from '@proton/pass/lib/globals/browser';

/* use PassCore::openSettings and remove this */
export const useOpenSettingsTab = () => {
    return useCallback(async (page?: string) => {
        try {
            const settingsUrl = browser.runtime.getURL('/settings.html');
            const url = `${settingsUrl}#/${page ?? ''}`;
            const match = await browser.tabs.query({ url: settingsUrl });

            await (match.length > 0 && match[0].id
                ? browser.tabs.update(match[0].id, { active: true, url })
                : browser.tabs.create({ url }));

            window.close();
        } catch (_) {}
    }, []);
};
