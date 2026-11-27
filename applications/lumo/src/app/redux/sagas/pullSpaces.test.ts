import { runSaga } from 'redux-saga';

import type { ListSpacesRemote, RemoteConversation, RemoteSpace } from '../../remote/types';
import { locallyRefreshConversationFromRemoteRequest } from '../slices/core/conversations';
import { pullSpacesFailure, pullSpacesSuccess } from '../slices/core/spaces';
import { pullSpaces } from './pullSpaces';

const events = vi.hoisted(() => [] as string[]);
const spaces = vi.hoisted(() => ({}) as Record<string, unknown>);

vi.mock('./spaces', async () => {
    const { delay } = await import('redux-saga/effects');
    return {
        refreshSpaceFromRemote: vi.fn(function* ({ payload }: { payload: { id: string } }) {
            yield delay(10);
            spaces[payload.id] = payload;
            events.push(`space:${payload.id}`);
        }),
        softDeleteSpaceFromRemote: vi.fn(function* () {
            throw new Error('Delete failed');
        }),
    };
});

vi.mock('./conversations', async () => {
    const { delay } = await import('redux-saga/effects');
    return {
        // Decrypting and storing a chat takes a while, as it does in the app.
        refreshConversationFromRemote: vi.fn(function* ({ payload }: { payload: { id: string } }) {
            yield delay(50);
            events.push(`chat:${payload.id}`);
        }),
        softDeleteConversationFromRemote: vi.fn(function* ({ payload }: { payload: string }) {
            events.push(`deleted-chat:${payload}`);
        }),
    };
});

const space = (id: string) => ({ id, remoteId: `server-${id}` }) as unknown as RemoteSpace;
const chat = (id: string, spaceId: string) => ({ id, spaceId }) as unknown as RemoteConversation;

const page: ListSpacesRemote = {
    spaces: { saved: space('saved') },
    deletedSpaces: { gone: { id: 'gone' } as never },
    conversations: { first: chat('first', 'saved'), orphan: chat('orphan', 'missing') },
    deletedConversations: {},
    assets: {},
    deletedAssets: {},
};

const run = (listSpaces: () => Promise<ListSpacesRemote>) =>
    runSaga(
        {
            dispatch: (action: { type: string }) => {
                events.push(action.type);
            },
            getState: () => ({ spaces }),
            context: { lumoApi: { listSpaces } },
        },
        pullSpaces
    ).toPromise();

describe('pullSpaces', () => {
    beforeEach(() => {
        events.length = 0;
        for (const id of Object.keys(spaces)) {
            delete spaces[id];
        }
    });

    it('reports success only after every chat on the page is in Redux', async () => {
        await run(vi.fn().mockResolvedValue(page));

        expect(events).toEqual([
            'space:saved',
            // The space of this chat never loaded, so it is handed to the background worker instead of blocking.
            locallyRefreshConversationFromRemoteRequest.type,
            'chat:first',
            pullSpacesSuccess.type,
        ]);
    });

    it('reports failure when a page cannot be listed', async () => {
        await run(vi.fn().mockRejectedValue(new Error('Network failure')));

        expect(events).toEqual([pullSpacesFailure.type]);
    });
});
