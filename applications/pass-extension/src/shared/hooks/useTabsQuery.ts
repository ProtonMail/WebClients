import { useEffect } from 'react';

import type { Tabs } from 'webextension-polyfill';

import browser from '@proton/pass/globals/browser';
import { logger } from '@proton/pass/utils/logger';

export const useTabsQuery = (query: Tabs.QueryQueryInfoType, onTabsResult: (url: Tabs.Tab[]) => void) => {
    useEffect(() => {
        browser.tabs.query(query).then(onTabsResult).catch(logger.warn);
    }, []);
};
