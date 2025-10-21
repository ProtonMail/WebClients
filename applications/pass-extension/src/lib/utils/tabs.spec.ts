import { default as browserAPI } from 'proton-pass-extension/__mocks__/webextension-polyfill';

import type { ClientEndpoint } from '@proton/pass/types';

import { assertTabsAPIAvailable } from './tabs';

const browser = browserAPI as Partial<typeof browserAPI>;
const tabsAPI = browserAPI.tabs;
const setBuildTarget = (value: string) => ((global as any).BUILD_TARGET = value);

describe('assertTabsAPIAvailable', () => {
    beforeEach(() => {
        browser.tabs = tabsAPI;
    });

    test('returns `false` when tabs API is unavailable', () => {
        delete browser.tabs;
        expect(assertTabsAPIAvailable('popup')).toBe(false);
    });

    test('returns `true` when tabs API is available', () => {
        expect(assertTabsAPIAvailable('popup')).toBe(true);
    });

    describe('Safari restrictions', () => {
        beforeEach(() => setBuildTarget('safari'));

        test.each<ClientEndpoint>(['contentscript', 'dropdown', 'notification'])(
            'returns `false` for `%s` endpoint on Safari',
            (endpoint) => expect(assertTabsAPIAvailable(endpoint)).toBe(false)
        );

        test.each<ClientEndpoint>(['popup', 'background', 'page'])(
            'returns `true` for `%s` endpoint on Safari',
            (endpoint) => expect(assertTabsAPIAvailable(endpoint)).toBe(true)
        );
    });
});
