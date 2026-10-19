import type { UnknownAction } from '@reduxjs/toolkit';
import { runSaga } from 'redux-saga';

import type { SyncArtifactAssetRequest } from '../slices/artifactAssetSync';
import { addAttachment, locallyDeleteAttachmentFromLocalRequest } from '../slices/core/attachments';
import { setConversationArtifactAsset } from '../slices/core/conversations';
import type { LumoState } from '../store';
import { syncArtifactAssetSerialized } from './artifactAssets';
import { pushAttachment } from './attachments';

jest.mock('./attachments', () => {
    return { pushAttachment: jest.fn() };
});

jest.mock('../../components/Conversation/artifact/buildArtifactAssetFile', () => {
    return {
        artifactTypeSupportsAssetSync: () => {
            return true;
        },
        buildArtifactAssetFile: async ({ content }: { content: string }) => {
            return { data: content, fileName: 'snippet.js', mimeType: 'text/javascript' };
        },
        preparedFileToBytes: (data: string) => {
            return new TextEncoder().encode(data);
        },
    };
});

const conversationId = 'conv-1';
const artifactId = 'artifact-1';
const previousAttachmentId = 'attachment-p0';

const createRequest = (messageId: string): SyncArtifactAssetRequest => {
    return {
        conversationId,
        artifactId,
        messageId,
        title: 'Snippet',
        type: 'code',
        content: `console.log('${messageId}');`,
        language: 'javascript',
    };
};

interface Deferred {
    promise: Promise<void>;
    resolve: () => void;
}

const createDeferred = (): Deferred => {
    let resolve = () => {};
    const promise = new Promise<void>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

const flush = async () => {
    for (let i = 0; i < 10; i++) {
        await Promise.resolve();
    }
};

/**
 * Runs each request as its own saga (as `takeEvery` would) against a state whose pointer updates
 * when the saga dispatches `setConversationArtifactAsset`.
 */
const createHarness = () => {
    const dispatched: UnknownAction[] = [];
    const state = {
        conversations: {
            [conversationId]: {
                id: conversationId,
                spaceId: 'space-1',
                artifactAssets: {
                    [artifactId]: { attachmentId: previousAttachmentId, syncedMessageId: 'msg-0' },
                },
            },
        },
    } as unknown as LumoState;

    const dispatch = (action: UnknownAction) => {
        dispatched.push(action);
        if (setConversationArtifactAsset.match(action)) {
            const { artifactId: id, pointer } = action.payload;
            const conversation = state.conversations[conversationId];
            conversation.artifactAssets = { ...conversation.artifactAssets, [id]: pointer };
        }
    };

    const run = (request: SyncArtifactAssetRequest) => {
        return runSaga({ dispatch, getState: () => state }, syncArtifactAssetSerialized, {
            payload: request,
        }).toPromise();
    };

    const uploadedIds = () => {
        return dispatched.filter(addAttachment.match).map((action) => action.payload.id);
    };

    const deletedIds = () => {
        return dispatched.filter(locallyDeleteAttachmentFromLocalRequest.match).map((action) => action.payload);
    };

    return { state, run, uploadedIds, deletedIds };
};

describe('syncArtifactAssetSerialized', () => {
    const pushAttachmentMock = pushAttachment as unknown as jest.Mock;
    let pushes: Deferred[];

    beforeEach(() => {
        pushes = [];
        pushAttachmentMock.mockReset();
        pushAttachmentMock.mockImplementation(() => {
            const deferred = createDeferred();
            pushes.push(deferred);
            return deferred.promise;
        });
    });

    it('uploads a version once when the same request arrives during its upload', async () => {
        const harness = createHarness();

        const first = harness.run(createRequest('msg-1'));
        await flush();
        const second = harness.run(createRequest('msg-1'));
        await flush();

        expect(pushes).toHaveLength(1);
        pushes[0].resolve();
        await Promise.all([first, second]);

        expect(harness.uploadedIds()).toHaveLength(1);
        expect(harness.deletedIds()).toEqual([previousAttachmentId]);
        expect(harness.state.conversations[conversationId].artifactAssets?.[artifactId]).toEqual({
            attachmentId: harness.uploadedIds()[0],
            syncedMessageId: 'msg-1',
        });
    });

    it('syncs a newer version after the running upload and replaces the right attachment', async () => {
        const harness = createHarness();

        const first = harness.run(createRequest('msg-1'));
        await flush();
        const second = harness.run(createRequest('msg-2'));
        await flush();

        expect(pushes).toHaveLength(1);
        pushes[0].resolve();
        await flush();

        expect(pushes).toHaveLength(2);
        pushes[1].resolve();
        await Promise.all([first, second]);

        const [v1AttachmentId, v2AttachmentId] = harness.uploadedIds();
        expect(harness.uploadedIds()).toHaveLength(2);
        expect(harness.deletedIds()).toEqual([previousAttachmentId, v1AttachmentId]);
        expect(harness.state.conversations[conversationId].artifactAssets?.[artifactId]).toEqual({
            attachmentId: v2AttachmentId,
            syncedMessageId: 'msg-2',
        });
    });

    it('only runs the newest of several requests that arrive during an upload', async () => {
        const harness = createHarness();

        const runs = [harness.run(createRequest('msg-1'))];
        await flush();
        runs.push(harness.run(createRequest('msg-2')), harness.run(createRequest('msg-3')));
        await flush();

        pushes[0].resolve();
        await flush();
        expect(pushes).toHaveLength(2);
        pushes[1].resolve();
        await Promise.all(runs);

        expect(harness.uploadedIds()).toHaveLength(2);
        expect(harness.state.conversations[conversationId].artifactAssets?.[artifactId]?.syncedMessageId).toBe('msg-3');
    });

    it('keeps syncing a creation after a failed upload', async () => {
        const harness = createHarness();
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        pushAttachmentMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('network'));
        });

        await harness.run(createRequest('msg-1'));
        const retry = harness.run(createRequest('msg-1'));
        await flush();
        pushes[0].resolve();
        await retry;

        expect(harness.uploadedIds()).toHaveLength(2);
        expect(harness.state.conversations[conversationId].artifactAssets?.[artifactId]?.syncedMessageId).toBe('msg-1');
        consoleError.mockRestore();
    });
});
