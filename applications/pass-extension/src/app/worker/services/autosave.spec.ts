import WorkerMessageBroker from 'proton-pass-extension/__mocks__/app/worker/channel';
import store from 'proton-pass-extension/__mocks__/app/worker/store';
import { getMockItem, getMockPasskey, getMockState, mockShareId } from 'proton-pass-extension/__mocks__/mocks';

import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { itemCreationIntent, itemCreationSuccess, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import type { FormEntry, ItemCreateIntent, ItemEditIntent } from '@proton/pass/types';
import { AutosaveType, FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { createAutoSaveService } from './autosave';

describe('AutosaveService [worker]', () => {
    const autosave = createAutoSaveService();

    beforeEach(() => store.getState.mockReturnValue(getMockState()));
    afterEach(() => store.getState.mockClear());

    describe('shouldPrompt', () => {
        const submission: FormEntry<FormEntryStatus.COMMITTED> = {
            data: { username: 'test@proton.me', password: 'p4ssw0rd' },
            domain: 'domain.com',
            partial: false,
            status: FormEntryStatus.COMMITTED,
            subdomain: 'domain.com',
            type: 'login',
        };

        test('should prompt for new item if no match', () => {
            const result = autosave.shouldPrompt(submission);
            expect(result).toEqual({ shouldPrompt: true, data: { type: AutosaveType.NEW } });
        });

        test('should prompt for item update if match and password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('username', submission.data.username)
                .set('password', '') /* different password */
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.shouldPrompt(submission)).toEqual({
                shouldPrompt: true,
                data: {
                    type: AutosaveType.UPDATE,
                    candidates: [
                        {
                            itemId: revision.itemId,
                            shareId: mockShareId,
                            name: 'Domain.com',
                            url: 'https://domain.com/',
                            username: 'test@proton.me',
                        },
                    ],
                },
            });
        });

        test('should not prompt for item update if match and no password change', () => {
            const item = itemBuilder('login');
            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('username', submission.data.username)
                .set('password', submission.data.password) /* same password */
                .set('urls', ['https://domain.com/']);

            const revision = getMockItem(item.data);
            const state = getMockState();
            state.items.byShareId[mockShareId][revision.itemId] = revision;
            store.getState.mockReturnValueOnce(state);

            expect(autosave.shouldPrompt(submission)).toEqual({ shouldPrompt: false });
        });
    });

    describe('`AUTOSAVE_REQUEST`', () => {
        test('should setup message handler', () => {
            const [type] = WorkerMessageBroker.registerMessage.mock.calls[0];
            expect(type).toEqual(WorkerMessageType.AUTOSAVE_REQUEST);
        });

        test('should handle new item', async () => {
            const response = sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: {
                        type: AutosaveType.NEW,
                        username: 'john@proton.me',
                        password: '123',
                        domain: 'proton.me',
                        name: 'Test item',
                    },
                })
            );

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemCreationIntent>;
            const created = action.payload as ItemCreateIntent<'login'>;

            expect(itemCreationIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Test item');
            expect(created.content.urls).toEqual(['https://proton.me/']);
            expect(deobfuscate(created.content.username)).toEqual('john@proton.me');
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
                        type: AutosaveType.NEW,
                        username: passkey.userName,
                        password: '',
                        domain: 'proton.me',
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
            expect(deobfuscate(created.content.username)).toEqual(passkey.userName);
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
                        domain: 'proton.me',
                        itemId: 'unknown-item-id',
                        name: 'Domain.com#Update',
                        password: 'new-password',
                        shareId: mockShareId,
                        type: AutosaveType.UPDATE,
                        username: 'test@proton.me',
                    },
                })
            );

            expect(response).toEqual({ type: 'error', error: 'Item does not exist' });
        });

        test('should handle item update', async () => {
            const item = itemBuilder('login');
            const passkey = getMockPasskey();

            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('username', 'test@proton.me')
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
                        domain: 'sub.domain.com',
                        itemId: revision.itemId,
                        name: 'Domain.com#Update',
                        password: 'new-password',
                        shareId: mockShareId,
                        type: AutosaveType.UPDATE,
                        username: 'test@proton.me',
                    },
                })
            );

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemEditIntent>;
            const created = action.payload as ItemEditIntent<'login'>;

            expect(itemEditIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Domain.com#Update');
            expect(created.content.urls).toEqual(['https://domain.com/', 'https://sub.domain.com/']);
            expect(deobfuscate(created.content.username)).toEqual('test@proton.me');
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
            const item = itemBuilder('login');
            const passkey = getMockPasskey();
            const newPasskey = getMockPasskey();

            item.get('metadata').set('name', 'Domain.com');
            item.get('content')
                .set('username', 'test@proton.me')
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
                        domain: 'domain.com',
                        itemId: revision.itemId,
                        name: 'Domain.com#Update',
                        passkey: newPasskey,
                        password: '',
                        shareId: mockShareId,
                        type: AutosaveType.UPDATE,
                        username: newPasskey.userName,
                    },
                })
            );

            const action = store.dispatch.mock.lastCall[0] as ReturnType<typeof itemEditIntent>;
            const created = action.payload as ItemEditIntent<'login'>;

            expect(itemEditIntent.match(action)).toBe(true);
            expect(created.metadata.name).toEqual('Domain.com#Update');
            expect(created.content.urls).toEqual(['https://domain.com/']);
            expect(deobfuscate(created.content.username)).toEqual('test@proton.me');
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
    });
});
