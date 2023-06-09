import { useCallback } from 'react';

import browser from '@proton/pass/globals/browser';

export const useOpenSettingsTab = () => {
    return useCallback(async (page?: string) => {
        const settingsUrl = browser.runtime.getURL('/settings.html');
        const url = `${settingsUrl}#/${page ?? ''}`;
        const match = await browser.tabs.query({ url: settingsUrl });

        await (match.length > 0 && match[0].id
            ? browser.tabs.update(match[0].id, { highlighted: true, url })
            : browser.tabs.create({ url }));

        window.close();
    }, []);
};
