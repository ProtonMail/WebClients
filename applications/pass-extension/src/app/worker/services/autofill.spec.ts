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
import { BUNDLED_MODEL_ID } from 'proton-pass-extension/lib/utils/version';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { ModelArtifact } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { assignedModelIdUpdated } from '@proton/pass/store/actions/creators/assigned-model-id';
import { sagaEvents } from '@proton/pass/store/events';
import type { State } from '@proton/pass/store/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { AutofillMode } from '@proton/pass/types/protobuf';
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
    let dispatch: jest.Mock;
    let getItems: jest.Mock;
    let setItem: jest.Mock;
    let service: ReturnType<typeof createAutoFillService>;

    const setLoginItem = (urls: string[]) => {
        state.items.byShareId[mockShareId][mockItemId] = getMockItemRevision({
            itemId: mockItemId,
            shareId: mockShareId,
            data: itemBuilder('login')
                .set('content', (content) =>
                    content.merge({
                        autofillUrls: urls.map((url) => ({ url, mode: AutofillMode.Default })),
                        itemUsername: username,
                        password: password,
                    })
                )
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
        dispatch = jest.fn();
        getItems = jest.fn().mockResolvedValue({});
        setItem = jest.fn();

        WorkerContext.set({
            ensureReady: jest.fn().mockResolvedValue(undefined),
            getState: jest.fn(() => ({ authorized })),
            service: {
                storage: { local: { getItems, setItem } },
                store: {
                    dispatch,
                    getState: jest.fn(() => state),
                },
            },
        } as any);

        service = createAutoFillService();
        setMockMessageSender(topLevelURL, 1);
    });

    afterEach(() => {
        WorkerContext.clear();
        sagaEvents.unsubscribe();
    });

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

    describe('`assignedModelId`', () => {
        test('Resolves the bundled model ID before the registry has been hydrated', () => {
            expect(service.getAssignedModelId()).toBe(BUNDLED_MODEL_ID);
        });

        test('Dispatches the group-specific resolved model ID on `model-registry::resolved`', async () => {
            await sagaEvents.publishAsync({
                type: 'model-registry::resolved',
                data: { control: '2026.10.1-lr', challenger: '2026.10.2-rf' },
            });

            expect(dispatch).toHaveBeenCalledWith(assignedModelIdUpdated('2026.10.1-lr'));
            expect(service.getAssignedModelId()).toBe('2026.10.1-lr');
        });

        test('Falls back to the bundled model ID when the resolved registry has no entry for the group', async () => {
            await sagaEvents.publishAsync({
                type: 'model-registry::resolved',
                data: { challenger: '2026.10.2-rf' },
            });

            expect(dispatch).toHaveBeenCalledWith(assignedModelIdUpdated(BUNDLED_MODEL_ID));
            expect(service.getAssignedModelId()).toBe(BUNDLED_MODEL_ID);
        });

        test('Dispatches the resolved model ID from the hydrated registry on `init`', async () => {
            getItems.mockResolvedValueOnce({
                modelRegistry: JSON.stringify({ control: '2026.10.1-lr', challenger: '2026.10.2-rf' }),
            });

            await service.init();

            expect(dispatch).toHaveBeenCalledWith(assignedModelIdUpdated('2026.10.1-lr'));
            expect(service.getAssignedModelId()).toBe('2026.10.1-lr');
        });

        test('Reads the experiment group from the live store rather than assuming `control`', async () => {
            state.user.featureVariants = {
                [PassFeature.PassAutofillModelExperimentGroup]: { name: 'challenger', payload: null },
            };

            await sagaEvents.publishAsync({
                type: 'model-registry::resolved',
                data: { control: '2026.10.1-lr', challenger: '2026.10.2-rf' },
            });

            expect(dispatch).toHaveBeenCalledWith(assignedModelIdUpdated('2026.10.2-rf'));
            expect(service.getAssignedModelId()).toBe('2026.10.2-rf');
        });
    });

    describe('`modelArtifact`', () => {
        const artifact = (modelId: string): ModelArtifact => ({ modelId, arch: 'lr', weights: {} }) as ModelArtifact;

        test('Returns null before any model artifact has been resolved', () => {
            expect(service.getModelArtifact('2026.8.2475-lr')).toBeNull();
        });

        test('Persists and exposes the artifact on `model-artifact::resolved`', async () => {
            await sagaEvents.publishAsync({ type: 'model-artifact::resolved', data: artifact('2026.8.2475-lr') });

            expect(service.getModelArtifact('2026.8.2475-lr')).toEqual(artifact('2026.8.2475-lr'));
            expect(setItem).toHaveBeenCalledWith(
                'modelArtifacts',
                JSON.stringify({ '2026.8.2475-lr': artifact('2026.8.2475-lr') })
            );
        });

        test('Evicts the oldest cached artifact beyond 2 models', async () => {
            await sagaEvents.publishAsync({ type: 'model-artifact::resolved', data: artifact('model-a') });
            await sagaEvents.publishAsync({ type: 'model-artifact::resolved', data: artifact('model-b') });
            await sagaEvents.publishAsync({ type: 'model-artifact::resolved', data: artifact('model-c') });

            expect(service.getModelArtifact('model-a')).toBeNull();
            expect(service.getModelArtifact('model-b')).toEqual(artifact('model-b'));
            expect(service.getModelArtifact('model-c')).toEqual(artifact('model-c'));
        });

        test('Hydrates the cached artifacts on `init`', async () => {
            getItems.mockResolvedValueOnce({
                modelArtifacts: JSON.stringify({ '2026.8.2475-lr': artifact('2026.8.2475-lr') }),
            });

            await service.init();

            expect(service.getModelArtifact('2026.8.2475-lr')).toEqual(artifact('2026.8.2475-lr'));
        });
    });
});
