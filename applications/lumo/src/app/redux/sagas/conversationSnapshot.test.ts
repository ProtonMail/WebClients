import { createOfflineError } from '@proton/shared/lib/fetch/ApiError';

import { generateSpaceKeyBase64 } from '../../crypto';
import { serializeConversation, serializeMessage } from '../../serialization';
import type { Conversation, Message, Space } from '../../types';
import { Role, getSpaceDek } from '../../types';
import { addConversation } from '../slices/core/conversations';
import { addMessage } from '../slices/core/messages';
import type { MessageMap } from '../slices/core/messages';
import type { LumoState } from '../store';
import type { LumoThunkArguments } from '../thunk';
import { LocalExportAvailableError, prepareConversationExport } from './conversationSnapshot';

const chat: Conversation = {
    id: 'chat',
    spaceId: 'space',
    title: 'Test chat',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
};
const serverChatId = 'server-chat';

const setup = async () => {
    const space = { id: chat.spaceId, spaceKey: generateSpaceKeyBase64() } as Space;
    const key = await getSpaceDek(space);
    const messages: Message[] = ['redux', 'disk', 'remote'].map((id) => ({
        id,
        conversationId: chat.id,
        createdAt: chat.createdAt,
        role: Role.User,
        content: `body-${id}`,
    }));
    const bodies = await Promise.all(
        messages.map(async (message) => ({
            ...(await serializeMessage(message, key))!,
            remoteId: `server-${message.id}`,
            remoteConversationId: serverChatId,
        }))
    );
    type Body = (typeof bodies)[number];
    const cached = new Map(bodies.slice(0, 2).map((body) => [body.id, body]));
    const storedConversation = { ...(await serializeConversation(chat, key))!, remoteId: serverChatId };
    const state = {
        conversations: { [chat.id]: chat },
        spaces: { [space.id]: space },
        idmap: { local2remote: { conversation: { [chat.id]: serverChatId }, space: {} } },
        messages: { redux: messages[0] } as MessageMap,
    };
    const lumoApi = {
        getConversation: vi.fn().mockResolvedValue({
            conversation: storedConversation,
            messages: bodies.map((body) => ({ ...body, encrypted: undefined })),
        }),
        getMessage: vi.fn(async (remoteId: string) => bodies.find((body) => body.remoteId === remoteId)),
    };
    const dbApi = {
        getMessageById: vi.fn(async (id: string) => cached.get(id)),
        getMessagesByConversationId: vi.fn(async () => [...cached.values()]),
        updateMessage: vi.fn(async (message: Body) => {
            cached.set(message.id, message);
        }),
        getConversationById: vi.fn().mockResolvedValue(storedConversation),
        getSpaceById: vi.fn().mockResolvedValue(undefined),
        updateConversation: vi.fn().mockResolvedValue(undefined),
        getRemoteIdFromLocalId: vi.fn().mockResolvedValue(undefined),
    };

    const prepare = (signal?: AbortSignal, allowUnverified = false) =>
        prepareConversationExport(
            chat.id,
            false,
            signal,
            allowUnverified
        )(
            (action) => {
                if (addMessage.match(action)) {
                    state.messages = { ...state.messages, [action.payload.id]: action.payload };
                }
                if (addConversation.match(action)) {
                    state.conversations[chat.id] = action.payload;
                }
                return action;
            },
            () => state as unknown as LumoState,
            { dbApi, lumoApi } as unknown as LumoThunkArguments
        );

    return { bodies, cached, dbApi, lumoApi, prepare, state, storedConversation };
};

describe('prepareConversationExport', () => {
    it('combines a decrypted Redux message, a cached ciphertext body, and a fetched body', async () => {
        const { lumoApi, prepare } = await setup();

        const snapshot = await prepare();

        expect(Object.fromEntries(Object.entries(snapshot.messages).map(([id, { content }]) => [id, content]))).toEqual(
            {
                redux: 'body-redux',
                disk: 'body-disk',
                remote: 'body-remote',
            }
        );
        expect(lumoApi.getMessage.mock.calls.map(([id]) => id)).toEqual(['server-remote']);
    });

    it('reuses a complete Redux message when IndexedDB has no body', async () => {
        const { cached, dbApi, lumoApi, prepare, state } = await setup();
        cached.delete('redux');
        state.messages.redux = { ...state.messages.redux, content: 'newer local body' };

        const snapshot = await prepare();

        expect(snapshot.messages.redux.content).toBe('newer local body');
        expect(lumoApi.getMessage.mock.calls.map(([id]) => id)).toEqual(['server-remote']);
        expect(dbApi.updateMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ id: 'redux' }),
            expect.anything()
        );
    });

    it('preserves a complete local edit that arrives during the server fetch', async () => {
        const { bodies, dbApi, lumoApi, prepare, state } = await setup();
        const body = Promise.withResolvers<(typeof bodies)[number]>();
        lumoApi.getMessage.mockReturnValueOnce(body.promise);
        const pending = prepare();
        await vi.waitFor(() => expect(lumoApi.getMessage).toHaveBeenCalledOnce());

        state.messages.remote = { ...state.messages.redux, id: 'remote', content: 'newer local body' };
        body.resolve(bodies[2]);

        expect((await pending).messages.remote.content).toBe('newer local body');
        expect(dbApi.updateMessage).not.toHaveBeenCalled();
    });

    it('requires explicit confirmation offline even after a successful full export', async () => {
        const { dbApi, lumoApi, prepare, state } = await setup();
        await prepare();
        state.messages = {};
        dbApi.updateMessage.mockClear();
        lumoApi.getMessage.mockClear();
        lumoApi.getConversation.mockRejectedValueOnce(createOfflineError({}));

        await expect(prepare()).rejects.toBeInstanceOf(LocalExportAvailableError);
        const offline = await prepare(undefined, true);

        expect(Object.fromEntries(Object.entries(offline.messages).map(([id, { content }]) => [id, content]))).toEqual({
            redux: 'body-redux',
            disk: 'body-disk',
            remote: 'body-remote',
        });
        expect(lumoApi.getMessage).not.toHaveBeenCalled();
        expect(dbApi.updateMessage).not.toHaveBeenCalled();
    });

    it.each([
        ['offline', createOfflineError({})],
        ['Chrome fetch failure', new TypeError('Failed to fetch')],
        ['Safari fetch failure', new TypeError('Load failed')],
        ['Firefox fetch failure', new TypeError('NetworkError when attempting to fetch resource.')],
        ['server unavailable', new Error('HTTP error: got 503')],
    ])('requires an explicit local export if the cached transcript is incomplete (%s)', async (_name, error) => {
        const { lumoApi, prepare } = await setup();
        lumoApi.getConversation.mockRejectedValueOnce(error);

        await expect(prepare()).rejects.toBeInstanceOf(LocalExportAvailableError);
        expect(Object.keys((await prepare(undefined, true)).messages).sort()).toEqual(['disk', 'redux']);
        expect(lumoApi.getMessage).not.toHaveBeenCalled();
    });

    it('offers available messages for an unverified persisted chat with pending local changes', async () => {
        const { dbApi, lumoApi, prepare, state, storedConversation } = await setup();
        delete state.idmap.local2remote.conversation[chat.id];
        dbApi.getConversationById.mockResolvedValue({ ...storedConversation, dirty: true });

        await expect(prepare()).rejects.toBeInstanceOf(LocalExportAvailableError);
        expect(Object.keys((await prepare(undefined, true)).messages).sort()).toEqual(['disk', 'redux']);
        expect(lumoApi.getConversation).not.toHaveBeenCalled();
    });

    it('does not use an offline snapshot when the server reports the chat unavailable', async () => {
        const { lumoApi, prepare } = await setup();
        await prepare();
        lumoApi.getConversation.mockResolvedValueOnce(null);
        await expect(prepare()).rejects.toThrow('Conversation is unavailable');
    });

    it('preserves access errors instead of offering a local export', async () => {
        const { lumoApi, prepare } = await setup();
        const error = new Error('HTTP error: got 403');
        lumoApi.getConversation.mockRejectedValueOnce(error);

        await expect(prepare()).rejects.toBe(error);
    });

    it('loads and repairs an unreadable cached body from the server', async () => {
        const { bodies, cached, lumoApi, prepare } = await setup();
        cached.set('disk', { ...bodies[1], encrypted: 'invalid' });

        const snapshot = await prepare();

        expect(snapshot.messages.disk.content).toBe('body-disk');
        expect(snapshot.messages.remote.content).toBe('body-remote');
        expect(lumoApi.getMessage.mock.calls.map(([id]) => id)).toContain('server-disk');
        expect(cached.get('disk')?.encrypted).toBe(bodies[1].encrypted);
    });

    it('rejects an incomplete export when the server also cannot supply the unreadable body', async () => {
        const { bodies, cached, lumoApi, prepare } = await setup();
        cached.set('disk', { ...bodies[1], encrypted: 'invalid' });
        lumoApi.getMessage.mockResolvedValue(undefined);

        await expect(prepare()).rejects.toThrow('Conversation message is unavailable');
    });

    it('hydrates a synced chat using the server ID persisted in IndexedDB', async () => {
        const { dbApi, lumoApi, prepare, state } = await setup();
        delete state.idmap.local2remote.conversation[chat.id];
        dbApi.getRemoteIdFromLocalId.mockResolvedValueOnce(serverChatId);

        expect(Object.keys((await prepare()).messages)).toHaveLength(3);
        expect(lumoApi.getConversation).toHaveBeenCalledWith(serverChatId, chat.spaceId);
    });

    it.each([false, true])('rejects a persisted chat with both IDs missing (dirty: %s)', async (dirty) => {
        const { dbApi, lumoApi, prepare, state, storedConversation } = await setup();
        delete state.idmap.local2remote.conversation[chat.id];
        dbApi.getConversationById.mockResolvedValue({ ...storedConversation, dirty });

        await expect(prepare()).rejects.toThrow();
        expect(lumoApi.getConversation).not.toHaveBeenCalled();
    });

    it.each(['conversations', 'spaces'] as const)('rejects when %s is deleted during the fetch', async (resource) => {
        const { bodies, dbApi, lumoApi, prepare, state } = await setup();
        const body = Promise.withResolvers<(typeof bodies)[number]>();
        lumoApi.getMessage.mockReturnValueOnce(body.promise);
        const result = expect(prepare()).rejects.toThrow(/unavailable locally/);
        await vi.waitFor(() => expect(lumoApi.getMessage).toHaveBeenCalledOnce());

        const id = resource === 'conversations' ? chat.id : chat.spaceId;
        delete state[resource][id];
        body.resolve(bodies[2]);

        await result;
        expect(dbApi.updateMessage).not.toHaveBeenCalled();
        expect(state.messages.remote).toBeUndefined();
    });

    it('cancels preparation without applying a body that arrives after the dialog closes', async () => {
        const { bodies, dbApi, lumoApi, prepare, state } = await setup();
        const body = Promise.withResolvers<(typeof bodies)[number]>();
        const controller = new AbortController();
        lumoApi.getMessage.mockReturnValueOnce(body.promise);
        const result = expect(prepare(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
        await vi.waitFor(() => expect(lumoApi.getMessage).toHaveBeenCalledOnce());

        controller.abort();
        await result;
        body.resolve(bodies[2]);
        await body.promise;

        expect(dbApi.updateMessage).not.toHaveBeenCalled();
        expect(state.messages.remote).toBeUndefined();
    });
});
