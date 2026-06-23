import { mockHandlers } from 'proton-pass-extension/__mocks__/app/worker/channel';
import {
    getMockItemRevision,
    getMockState,
    mockItemId,
    mockShareId,
    setMockMessageSender,
} from 'proton-pass-extension/__mocks__/mocks';
import { expectMessageFailure, expectMessageSuccess } from 'proton-pass-extension/__mocks__/utils';
import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { State } from '@proton/pass/store/types';
import type { AutofillQueryFilter } from '@proton/pass/types/worker/autofill';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { createAutoFillService } from './autofill';

describe('AutofillService', () => {
    const topLevelURL = 'https://bank.example/login';
    const attackerFrameURL = 'https://evil.example/frame';
    const subFrameId = 7;
    const username = 'victim@proton.test';
    const password = uniqueId();

    let state: State;
    let authorized: boolean;

    const setLoginItem = (urls: string[]) => {
        state.items.byShareId[mockShareId][mockItemId] = getMockItemRevision({
            itemId: mockItemId,
            shareId: mockShareId,
            data: itemBuilder('login')
                .set('content', (content) => content.merge({ urls, itemUsername: username, password: password }))
                .set('metadata', (metadata) => metadata.set('name', 'Bank login')).data,
        });
    };

    const queryLogins = (payload: AutofillQueryFilter) =>
        sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.AUTOFILL_LOGIN_QUERY,
                payload,
            })
        );

    beforeEach(() => {
        jest.clearAllMocks();
        clearBrowserMocks();
        mockHandlers.clear();

        authorized = true;
        state = getMockState();
        setLoginItem([topLevelURL]);
        browser.tabs.get.mockResolvedValue({ id: 1, url: topLevelURL });

        WorkerContext.set({
            ensureReady: jest.fn().mockResolvedValue(undefined),
            getState: jest.fn(() => ({ authorized })),
            service: {
                store: {
                    dispatch: jest.fn(),
                    getState: jest.fn(() => state),
                },
            },
        } as any);

        createAutoFillService();
        setMockMessageSender(topLevelURL, 1);
    });

    afterEach(() => WorkerContext.clear());

    describe('`AUTOFILL_LOGIN_QUERY`', () => {
        test('Returns matching item previews and reflects badge count', async () => {
            const result = await queryLogins({});

            expectMessageSuccess(result);
            expect(result.needsUpgrade).toBe(false);
            expect(browser.action.setBadgeText).toHaveBeenCalledWith({ tabId: 1, text: '1' });
            expect(result.items).toEqual([
                {
                    itemId: mockItemId,
                    shareId: mockShareId,
                    name: 'Bank login',
                    userIdentifier: username,
                    url: topLevelURL,
                },
            ]);
        });

        test('Clears the badge for a top-frame query with no candidates', async () => {
            setMockMessageSender('https://no-match.example', 1);
            const result = await queryLogins({});
            expectMessageSuccess(result);
            expect(result.items).toHaveLength(0);
            expect(browser.action.setBadgeText).toHaveBeenCalledWith({ tabId: 1, text: '' });
        });

        test('Errors when session is not authorized', async () => {
            authorized = false;
            const result = await queryLogins({});
            expectMessageFailure(result);
            expect(browser.action.setBadgeText).not.toHaveBeenCalled();
        });

        test('Cross-origin sub-frame yields no top-level url candidates', async () => {
            browser.webNavigation.getFrame.mockResolvedValue({ url: attackerFrameURL });
            const result = await queryLogins({ frameId: subFrameId });

            expectMessageSuccess(result);
            expect(browser.webNavigation.getFrame).toHaveBeenCalledWith({ tabId: 1, frameId: subFrameId });
            expect(result.items).toHaveLength(0);
            expect(browser.action.setBadgeText).not.toHaveBeenCalled();
        });

        test('Same-site sub-domain sub-frame resolves the parent-domain candidates', async () => {
            setLoginItem(['https://shop.com']);
            browser.webNavigation.getFrame.mockResolvedValue({ url: 'https://auth.shop.com/login' });
            const result = await queryLogins({ frameId: subFrameId });

            expectMessageSuccess(result);
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual(expect.objectContaining({ itemId: mockItemId, shareId: mockShareId }));
        });

        test('Top-frame uses `tab.url`', async () => {
            const result = await queryLogins({ frameId: 0 });

            expectMessageSuccess(result);
            expect(browser.webNavigation.getFrame).not.toHaveBeenCalled();
            expect(browser.tabs.get).toHaveBeenCalledWith(1);
            expect(result.items).toHaveLength(1);
        });

        test('Uses `sender.url` for an in-frame query from a cross-origin sub-frame', async () => {
            setMockMessageSender(topLevelURL, 1, attackerFrameURL, subFrameId);
            const result = await queryLogins({});

            expectMessageSuccess(result);
            expect(browser.webNavigation.getFrame).not.toHaveBeenCalled();
            expect(result.items).toHaveLength(0);
        });

        test('Uses `sender.url` for an in-frame query from the top frame', async () => {
            const result = await queryLogins({});

            expectMessageSuccess(result);
            expect(result.items).toHaveLength(1);
            expect(browser.webNavigation.getFrame).not.toHaveBeenCalled();
            expect(browser.tabs.get).not.toHaveBeenCalled();
        });

        test('Uses an explicit `domain` without resolving any frame', async () => {
            const result = await queryLogins({ domain: 'evil.example' });

            expectMessageSuccess(result);
            expect(result.items).toHaveLength(0);
            expect(browser.webNavigation.getFrame).not.toHaveBeenCalled();
            expect(browser.tabs.get).not.toHaveBeenCalled();
            expect(browser.action.setBadgeText).not.toHaveBeenCalled();
        });
    });

    describe('`AUTOFILL_ACTION`', () => {
        test('Delivers the selected login credentials to the target frame', async () => {
            const result = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_ACTION,
                    payload: {
                        type: 'login',
                        itemId: mockItemId,
                        shareId: mockShareId,
                        origin: 'bank.example',
                        frameOrigin: 'bank.example',
                        frameId: subFrameId,
                        formId: 'bank-form',
                        fieldId: 'bank-user',
                    },
                })
            );

            expectMessageSuccess(result);
            expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    payload: expect.objectContaining({
                        status: 'fill',
                        type: 'login',
                        credentials: { userIdentifier: username, password: password },
                    }),
                }),
                { frameId: subFrameId }
            );
        });
    });
});
