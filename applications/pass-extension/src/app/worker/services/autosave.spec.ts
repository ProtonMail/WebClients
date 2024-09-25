import WorkerMessageBroker from 'proton-pass-extension/__mocks__/app/worker/channel';
import store from 'proton-pass-extension/__mocks__/app/worker/store';
import {
    getMockItem,
    getMockPasskey,
    getMockState,
    mockShareId,
    setMockMessageSender,
} from 'proton-pass-extension/__mocks__/mocks';

import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { itemCreationIntent, itemCreationSuccess, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import type { FormEntry, ItemCreateIntent, ItemEditIntent } from '@proton/pass/types';
import { AutosaveMode, FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { WorkerContext } from '../context/inject';
import { createAutoSaveService } from './autosave';

describe('AutosaveService [worker]', () => {
    const autosave = createAutoSaveService();

    beforeEach(() => {
        WorkerContext.set({ service: { store } } as any);
        store.getState.mockReturnValue(getMockState());
    });

    afterEach(() => {
        WorkerContext.clear();
        store.getState.mockClear();
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
        };

        test('should prompt for new item if no match', () => {
            const result = autosave.resolve(submission);
            expect(result).toEqual({ shouldPrompt: true, data: { type: AutosaveMode.NEW } });
        });

        test('should not prompt if form credentials are invalid', () => {
            const result = autosave.resolve({ ...submission, data: { userIdentifier: '', password: '' } });
            expect(result).toEqual({ shouldPrompt: false });
        });

        test('should prompt for item update if matching email and password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', submission.data.userIdentifier)
                .set('itemUsername', '')
                .set('password', '') /* different password */
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission)).toEqual({
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
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission)).toEqual({
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
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission)).toEqual({ shouldPrompt: false });
        });

        test('should not prompt for item update if matching username and no password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemUsername', submission.data.userIdentifier)
                .set('password', submission.data.password) /* same password */
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission)).toEqual({ shouldPrompt: false });
        });

        test.each([
            { label: 'same url different port', value: 'https://domain.com:3000/' },
            { label: 'same url different protocol', value: 'http://domain.com/' },
        ])('should prompt if credentials match on $label', (testCase) => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', submission.data.userIdentifier)
                .set('password', submission.data.password) /* same password */
                .set('urls', [testCase.value]);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.resolve(submission)).toEqual({
                shouldPrompt: true,
                data: {
                    type: AutosaveMode.UPDATE,
                    candidates: [
                        {
                            itemId: revision.itemId,
                            shareId: mockShareId,
                            name: 'Domain.com',
                            url: testCase.value,
                            userIdentifier: 'test@proton.me',
                        },
                    ],
                },
            });
        });
    });

    describe('`AUTOSAVE_REQUEST`', () => {
        beforeEach(() => setMockMessageSender('https://proton.me'));

        test('should setup message handler', () => {
            const [type] = WorkerMessageBroker.registerMessage.mock.calls[0];
            expect(type).toEqual(WorkerMessageType.AUTOSAVE_REQUEST);
        });

        test('should handle new item with email', async () => {
            const response = sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        shareId: mockShareId,
                        userIdentifier: 'john@proton.me',
                        password: '123',
                        name: 'Test item',
                    },
                })
            );

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemCreationIntent>;
            const created = action.payload as ItemCreateIntent<'login'>;

            expect(itemCreationIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Test item');
            expect(created.content.urls).toEqual(['https://proton.me/']);
            expect(deobfuscate(created.content.itemEmail)).toEqual('john@proton.me');
            expect(deobfuscate(created.content.password)).toEqual('123');

            action.meta.callback?.(
                itemCreationSuccess({
                    optimisticId: 'test-optimstic-id',
                    shareId: mockShareId,
                    item: getMockItem(action.payload),
                })
            );

            await expect(response).resolves.toBe(true);
        });

        test('should handle new item with username', async () => {
            const response = sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        shareId: mockShareId,
                        userIdentifier: 'john',
                        password: '123',
                        name: 'Test item',
                    },
                })
            );

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemCreationIntent>;
            const created = action.payload as ItemCreateIntent<'login'>;

            expect(itemCreationIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Test item');
            expect(created.content.urls).toEqual(['https://proton.me/']);
            expect(deobfuscate(created.content.itemUsername)).toEqual('john');
            expect(deobfuscate(created.content.password)).toEqual('123');

            action.meta.callback?.(
                itemCreationSuccess({
                    optimisticId: 'test-optimstic-id',
                    shareId: mockShareId,
                    item: getMockItem(action.payload),
                })
            );

            await expect(response).resolves.toBe(true);
        });

        test('should handle new item with passkey', async () => {
            const passkey = getMockPasskey();

            const response = sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        shareId: mockShareId,
                        userIdentifier: passkey.userName,
                        password: '',
                        passkey,
                        name: 'Test passkey',
                    },
                })
            );

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemCreationIntent>;
            const created = action.payload as ItemCreateIntent<'login'>;

            expect(itemCreationIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Test passkey');
            expect(created.content.urls).toEqual(['https://proton.me/']);
            expect(deobfuscate(created.content.itemEmail)).toEqual(passkey.userName);
            expect(deobfuscate(created.content.password)).toEqual('');
            expect(created.content.passkeys).toEqual([passkey]);

            action.meta.callback?.(
                itemCreationSuccess({
                    optimisticId: 'test-optimstic-id',
                    shareId: mockShareId,
                    item: getMockItem(action.payload),
                })
            );

            await expect(response).resolves.toBe(true);
        });

        test('should fail if malformed request', async () => {
            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {} as any,
                })
            );

            expect(response).toEqual(false);
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

            expect(response).toEqual({
                type: 'error',
                error: 'Item does not exist',
                critical: false,
            });
        });

        test('should handle item update for subdomain', async () => {
            setMockMessageSender('https://sub.domain.com');
            const item = itemBuilder('login');
            const passkey = getMockPasskey();

            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('itemEmail', 'test@proton.me')
                .set('passkeys', [passkey])
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            const request = sendMessage(
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

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemEditIntent>;
            const created = action.payload as ItemEditIntent<'login'>;

            expect(itemEditIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Domain.com#Update');
            expect(created.content.urls).toEqual(['https://domain.com/', 'https://sub.domain.com/']);
            expect(deobfuscate(created.content.itemEmail)).toEqual('test@proton.me');
            expect(deobfuscate(created.content.password)).toEqual('new-password');
            expect(created.content.passkeys).toEqual([passkey]);

            action.meta.callback?.(
                itemEditSuccess({
                    shareId: mockShareId,
                    itemId: revision.itemId,
                    item: getMockItem(action.payload),
                })
            );

            await expect(request).resolves.toBe(true);
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
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            const request = sendMessage(
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

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemEditIntent>;
            const created = action.payload as ItemEditIntent<'login'>;

            expect(itemEditIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Domain.com#Update');
            expect(created.content.urls).toEqual(['https://domain.com/']);
            expect(deobfuscate(created.content.itemEmail)).toEqual('test@proton.me');
            expect(deobfuscate(created.content.password)).toEqual('existing-password');
            expect(created.content.passkeys).toEqual([passkey, newPasskey]);

            action.meta.callback?.(
                itemEditSuccess({
                    shareId: mockShareId,
                    itemId: revision.itemId,
                    item: getMockItem(action.payload),
                })
            );

            await expect(request).resolves.toBe(true);
        });

        test('should handle new item in url with port', async () => {
            setMockMessageSender('https://localhost:3000');

            const response = sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveMode.NEW,
                        shareId: mockShareId,
                        userIdentifier: 'john@proton.me',
                        password: '123',
                        name: 'Test item',
                    },
                })
            );

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemCreationIntent>;
            const created = action.payload as ItemCreateIntent<'login'>;

            expect(itemCreationIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Test item');
            expect(created.content.urls).toEqual(['https://localhost:3000/']);
            expect(deobfuscate(created.content.itemEmail)).toEqual('john@proton.me');
            expect(deobfuscate(created.content.password)).toEqual('123');

            action.meta.callback?.(
                itemCreationSuccess({
                    optimisticId: 'test-optimstic-id',
                    shareId: mockShareId,
                    item: getMockItem(action.payload),
                })
            );

            await expect(response).resolves.toBe(true);
        });
    });
});
