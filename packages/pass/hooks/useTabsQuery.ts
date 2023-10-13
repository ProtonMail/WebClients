import { useEffect } from 'react';

import type { Tabs } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

export const useTabsQuery = (query: Tabs.QueryQueryInfoType, onTabsResult: (url: Tabs.Tab[]) => void) => {
    useEffect(() => {
        browser.tabs.query(query).then(onTabsResult).catch(noop);
    }, []);
};
