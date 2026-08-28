import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { parseUrl } from '@proton/pass/lib/urls/utils/parser';
import { itemCreate, itemEdit } from '@proton/pass/store/actions';
import type { FormEntry } from '@proton/pass/types';
import { AutosaveMode, FormEntryStatus } from '@proton/pass/types';
import { AutofillMode } from '@proton/pass/types/protobuf';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import {
    getMockItemRevision,
    getMockPasskey,
    getMockState,
    mockShareId,
    setMockMessageSender,
} from '../../../__mocks__/mocks';
import { expectMessageFailure, expectMessageSuccess } from '../../../__mocks__/utils';
import { contentScriptMessage, sendMessage } from '../../../lib/message/send-message';
import { WorkerMessageType } from '../../../types/messages';
import type * as ChannelMock from '../__mocks__/channel';
import store from '../__mocks__/store';
import { WorkerContext } from '../context/inject';
import { createAutoSaveService } from './autosave';

jest.mock('../channel');

const { default: WorkerMessageBroker } = jest.requireMock('../channel') as typeof ChannelMock;

describe('AutosaveService [worker]', () => {
    const autosave = createAutoSaveService();

    beforeEach(() => {
        WorkerContext.set({ service: { store } } as any);
        store.getState.mockReturnValue(getMockState());
    });

    afterEach(() => {
        WorkerContext.clear();
        store.getState.mockClear();
        store.dispatch.mockClear();
        store.dispatchAsyncRequest.mockClear();
    });

    describe('resolve', () => {
        const submission: FormEntry<FormEntryStatus.COMMITTED> = {
            data: { userIdentifier: 'test@proton.me', password: 'p4ssw0rd' },
            domain: 'domain.com',
            port: null,
            protocol: 'https:',
            formId: uniqueId(),
            status: FormEntryStatus.COMMITTED,
            submit: false,
            type: 'login',
            updatedAt: -1,
            submittedAt: -1,
            frameId: 0,
        };

        const url = parseUrl('https://domain.com');

        test('should prompt for new item if no match', () => {
            const result = autosave.resolve(submission, url);
            expect(result).toEqual({ shouldPrompt: true, data: { type: AutosaveMode.NEW } });
        });

        test('should not prompt if form credentials are invalid', () => {
            const result = autosave.resolve({ ...submission, data: { userIdentifier: '', password: '' } }, url);
            expect(result).toEqual({ shouldPrompt: false });
        });

        test('should prompt for item update if matching email and password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', submission.data.userIdentifier)
                .set('itemUsername', '')
                .set('password', '') /* different password */
                .set('autofillUrls', [{ url: 'https://domain.com/', mode: AutofillMode.Default }]);

            const revision = getMockItemRevision({ data: item.data });
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission, url)).toEqual({
                shouldPrompt: true,
                data: {
                    type: AutosaveMode.UPDATE,
                    candidates: [
                        {
                            itemId: revision.itemId,
                            shareId: mockShareId,
                            name: 'Domain.com',
                            url: 'https://domain.com/',
                            userIdentifier: 'test@proton.me',
                        },
                    ],
                },
            });
        });

        test('should prompt for item update if matching username and password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', '')
                .set('itemUsername', submission.data.userIdentifier)
                .set('password', '') /* different password */
                .set('autofillUrls', [{ url: 'https://domain.com/', mode: AutofillMode.Default }]);

            const revision = getMockItemRevision({ data: item.data });
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission, url)).toEqual({
                shouldPrompt: true,
                data: {
                    type: AutosaveMode.UPDATE,
                    candidates: [
                        {
                            itemId: revision.itemId,
                            shareId: mockShareId,
                            name: 'Domain.com',
                            url: 'https://domain.com/',
                            userIdentifier: 'test@proton.me',
                        },
                    ],
                },
            });
        });

        test('should not prompt for item update if matching email and no password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', submission.data.userIdentifier)
                .set('password', submission.data.password) /* same password */
                .set('autofillUrls', [{ url: 'https://domain.com/', mode: AutofillMode.Default }]);

            const revision = getMockItemRevision({ data: item.data });
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission, url)).toEqual({ shouldPrompt: false });
        });

        test('should not prompt for item update if matching username and no password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemUsername', submission.data.userIdentifier)
                .set('password', submission.data.password) /* same password */
                .set('autofillUrls', [{ url: 'https://domain.com/', mode: AutofillMode.Default }]);

            const revision = getMockItemRevision({ data: item.data });
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission, url)).toEqual({ shouldPrompt: false });
        });

        test.each([
            { label: 'no port specified while browsing', value: 'https://domain.com:3000/' },
            { label: 'browsing with an upgraded https protocol', value: 'http://domain.com/' },
        ])("should not prompt on $label (matches the engine's own port/protocol leniency)", (testCase) => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', submission.data.userIdentifier)
                .set('password', submission.data.password) /* same password */
                .set('autofillUrls', [{ url: testCase.value, mode: AutofillMode.Default }]);

            const revision = getMockItemRevision({ data: item.data });
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission, url)).toEqual({ shouldPrompt: false });
        });
    });

    describe('`AUTOSAVE_REQUEST`', () => {
        beforeEach(() => setMockMessageSender('https://proton.me'));

        test('should setup message handler', () => {
            const [type] = WorkerMessageBroker.registerMessage.mock.calls[0];
            expect(type).toEqual(WorkerMessageType.AUTOSAVE_REQUEST);
        });

        test('should handle new item with email', async () => {
            store.dispatchAsyncRequest.mockImplementationOnce(async () => ({ type: 'success' }));

            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        optimisticId: uniqueId(),
                        shareId: mockShareId,
                        userIdentifier: 'john@proton.me',
                        password: '123',
                        name: 'Test item',
                    },
                })
            );

            const [actions, created] = store.dispatchAsyncRequest.mock.lastCall;

            expectMessageSuccess(response);
            expect(actions).toEqual(itemCreate);
            expect(created.metadata.name).toEqual('Test item');
            expect(created.content.autofillUrls).toEqual([{ url: 'https://proton.me/', mode: AutofillMode.Default }]);
            expect(deobfuscate(created.content.itemEmail)).toEqual('john@proton.me');
            expect(deobfuscate(created.content.password)).toEqual('123');
        });

        test('should handle new item with username', async () => {
            store.dispatchAsyncRequest.mockImplementationOnce(async () => ({ type: 'success' }));

            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        optimisticId: uniqueId(),
                        shareId: mockShareId,
                        userIdentifier: 'john',
                        password: '123',
                        name: 'Test item',
                    },
                })
            );

            const [actions, created] = store.dispatchAsyncRequest.mock.lastCall;

            expectMessageSuccess(response);
            expect(actions).toEqual(itemCreate);
            expect(created.metadata.name).toEqual('Test item');
            expect(created.content.autofillUrls).toEqual([{ url: 'https://proton.me/', mode: AutofillMode.Default }]);
            expect(deobfuscate(created.content.itemUsername)).toEqual('john');
            expect(deobfuscate(created.content.password)).toEqual('123');
        });

        test('should handle new item with passkey', async () => {
            store.dispatchAsyncRequest.mockImplementationOnce(async () => ({ type: 'success' }));

            const passkey = getMockPasskey();
            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        optimisticId: uniqueId(),
                        shareId: mockShareId,
                        userIdentifier: passkey.userName,
                        password: '',
                        passkey,
                        name: 'Test passkey',
                    },
                })
            );

            const [actions, created] = store.dispatchAsyncRequest.mock.lastCall;

            expectMessageSuccess(response);
            expect(actions).toEqual(itemCreate);
            expect(created.metadata.name).toEqual('Test passkey');
            expect(created.content.autofillUrls).toEqual([{ url: 'https://proton.me/', mode: AutofillMode.Default }]);
            expect(deobfuscate(created.content.itemEmail)).toEqual(passkey.userName);
            expect(deobfuscate(created.content.password)).toEqual('');
            expect(created.content.passkeys).toEqual([passkey]);
        });

        test('should fail if malformed request', async () => {
            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {} as any,
                })
            );

            expectMessageFailure(response);
        });

        test('should return error if item to update does not exist', async () => {
            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        itemId: 'unknown-item-id',
                        name: 'Domain.com#Update',
                        password: 'new-password',
                        shareId: mockShareId,
                        type: AutosaveMode.UPDATE,
                        userIdentifier: 'test@proton.me',
                    },
                })
            );

            expectMessageFailure(response);
            expect(response.error).toBe('Item does not exist');
        });

        test('should handle item update for subdomain', async () => {
            setMockMessageSender('https://sub.domain.com');
            const item = itemBuilder('login');
            const passkey = getMockPasskey();

            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', 'test@proton.me')
                .set('passkeys', [passkey])
                .set('autofillUrls', [{ url: 'https://domain.com/', mode: AutofillMode.Default }]);

            const revision = getMockItemRevision({ data: item.data });
            const state = getMockState();

            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);
            store.dispatchAsyncRequest.mockImplementationOnce(async () => ({ type: 'success' }));

            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        itemId: revision.itemId,
                        name: 'Domain.com#Update',
                        password: 'new-password',
                        shareId: mockShareId,
                        type: AutosaveMode.UPDATE,
                        userIdentifier: 'test@proton.me',
                    },
                })
            );

            const [actions, updated] = store.dispatchAsyncRequest.mock.lastCall;

            expectMessageSuccess(response);
            expect(actions).toEqual(itemEdit);
            expect(updated.metadata.name).toEqual('Domain.com#Update');
            expect(updated.content.autofillUrls).toEqual([
                { url: 'https://domain.com/', mode: AutofillMode.Default },
                { url: 'https://sub.domain.com/', mode: AutofillMode.Default },
            ]);
            expect(deobfuscate(updated.content.itemEmail)).toEqual('test@proton.me');
            expect(deobfuscate(updated.content.password)).toEqual('new-password');
            expect(updated.content.passkeys).toEqual([passkey]);
        });

        test('should handle item update with passkey', async () => {
            setMockMessageSender('https://domain.com');

            const item = itemBuilder('login');
            const passkey = getMockPasskey();
            const newPasskey = getMockPasskey();

            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', 'test@proton.me')
                .set('password', 'existing-password')
                .set('passkeys', [passkey])
                .set('autofillUrls', [{ url: 'https://domain.com/', mode: AutofillMode.Default }]);

            const revision = getMockItemRevision({ data: item.data });
            const state = getMockState();

            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);
            store.dispatchAsyncRequest.mockImplementationOnce(async () => ({ type: 'success' }));

            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        itemId: revision.itemId,
                        name: 'Domain.com#Update',
                        passkey: newPasskey,
                        password: '',
                        shareId: mockShareId,
                        type: AutosaveMode.UPDATE,
                        userIdentifier: newPasskey.userName,
                    },
                })
            );

            const [actions, updated] = store.dispatchAsyncRequest.mock.lastCall;

            expectMessageSuccess(response);
            expect(actions).toEqual(itemEdit);
            expect(updated.metadata.name).toEqual('Domain.com#Update');
            expect(updated.content.autofillUrls).toEqual([{ url: 'https://domain.com/', mode: AutofillMode.Default }]);
            expect(deobfuscate(updated.content.itemEmail)).toEqual('test@proton.me');
            expect(deobfuscate(updated.content.password)).toEqual('existing-password');
            expect(updated.content.passkeys).toEqual([passkey, newPasskey]);
        });

        test('should handle new item in url with port', async () => {
            setMockMessageSender('https://localhost:3000');
            store.dispatchAsyncRequest.mockImplementationOnce(async () => ({ type: 'success' }));

            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        optimisticId: uniqueId(),
                        shareId: mockShareId,
                        userIdentifier: 'john@proton.me',
                        password: '123',
                        name: 'Test item',
                    },
                })
            );

            const [actions, created] = store.dispatchAsyncRequest.mock.lastCall;

            expectMessageSuccess(response);
            expect(actions).toEqual(itemCreate);
            expect(created.metadata.name).toEqual('Test item');
            expect(created.content.autofillUrls).toEqual([
                { url: 'https://localhost:3000/', mode: AutofillMode.Default },
            ]);
            expect(deobfuscate(created.content.itemEmail)).toEqual('john@proton.me');
            expect(deobfuscate(created.content.password)).toEqual('123');
        });
    });
});
