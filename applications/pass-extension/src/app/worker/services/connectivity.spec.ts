import type { Runtime } from 'webextension-polyfill';

import type { ClientEndpoint } from '@proton/pass/types/worker/runtime';

import { isNavigatorSource } from './connectivity';

jest.mock('../channel');

describe('isNavigatorSource', () => {
    test.each<[ClientEndpoint, Runtime.MessageSender, boolean]>([
        ['popup', {}, true],
        ['page', { frameId: 0 }, true],
        ['page', { frameId: 3 }, false],
        ['page', {}, false],
        ['dropdown', { frameId: 0 }, false],
        ['notification', { frameId: 0 }, false],
        ['contentscript', { frameId: 0 }, false],
    ])('`%s` endpoint with sender %j should be trusted: %s', (endpoint, sender, expected) => {
        expect(isNavigatorSource(endpoint, sender)).toBe(expected);
    });
});
