import type { SagaIterator } from 'redux-saga';
import { call, put, select } from 'redux-saga/effects';

import {
    artifactTypeSupportsAssetSync,
    buildArtifactAssetFile,
    preparedFileToBytes,
} from '../../components/Conversation/artifact/buildArtifactAssetFile';
import type { ParsedArtifact } from '../../components/Conversation/artifact/parseArtifacts';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import type { Attachment } from '../../types';
import { selectConversationById } from '../selectors';
import type { SyncArtifactAssetRequest } from '../slices/artifactAssetSync';
import { addAttachment, locallyDeleteAttachmentFromLocalRequest, newAttachmentId } from '../slices/core/attachments';
import { pushConversationRequest, setConversationArtifactAsset } from '../slices/core/conversations';
import { pushAttachment } from './attachments';

function* syncArtifactAsset({ payload }: { payload: SyncArtifactAssetRequest }): SagaIterator<void> {
    const { conversationId, artifactId, messageId, title, type, content, language } = payload;

    if (!artifactTypeSupportsAssetSync(type)) {
        return;
    }

    const conversation = yield select(selectConversationById(conversationId));
    if (!conversation?.spaceId) {
        return;
    }

    const existingPointer = conversation.artifactAssets?.[artifactId];
    if (existingPointer?.syncedMessageId === messageId) {
        return;
    }

    const parsed: ParsedArtifact = {
        id: artifactId,
        type,
        title,
        content,
        language,
    };

    let prepared;
    try {
        prepared = yield call(buildArtifactAssetFile, parsed);
    } catch (error) {
        console.error('syncArtifactAsset: failed to build file', { conversationId, artifactId, error });
        return;
    }

    const bytes = preparedFileToBytes(prepared.data);
    const attachmentId = newAttachmentId();

    attachmentDataCache.setData(attachmentId, bytes);

    const attachment: Attachment = {
        id: attachmentId,
        spaceId: conversation.spaceId,
        filename: prepared.fileName,
        mimeType: prepared.mimeType,
        uploadedAt: new Date().toISOString(),
        rawBytes: bytes.length,
        role: 'assistant',
        generatedArtifactAsset: {
            conversationId,
            artifactId,
            artifactType: type,
            artifactTitle: title,
        },
    };

    yield put(addAttachment(attachment));

    try {
        yield call(pushAttachment, { payload: { id: attachmentId, priority: 'background' } });
    } catch (error) {
        console.error('syncArtifactAsset: push failed', { conversationId, artifactId, attachmentId, error });
        return;
    }

    yield put(
        setConversationArtifactAsset({
            id: conversationId,
            artifactId,
            pointer: { attachmentId, syncedMessageId: messageId },
        })
    );
    yield put(pushConversationRequest({ id: conversationId }));

    const previousAttachmentId = existingPointer?.attachmentId;
    if (previousAttachmentId && previousAttachmentId !== attachmentId) {
        // Superseded generated asset: mark dirty and push HTTP DELETE (Option A). Remote-only
        // soft delete would leave stale rows in GET /assets/generated.
        yield put(locallyDeleteAttachmentFromLocalRequest(previousAttachmentId));
    }
}

const getArtifactSyncKey = ({ conversationId, artifactId }: SyncArtifactAssetRequest): string => {
    return `${conversationId}:${artifactId}`;
};

const syncingArtifactKeys = new Set<string>();
const pendingArtifactSyncRequests = new Map<string, SyncArtifactAssetRequest>();

/**
 * Runs `syncArtifactAsset` one at a time per creation. The pointer that dedupes a version and names
 * the attachment to replace is only written once an upload finishes, so two overlapping runs would
 * both upload and both delete the same previous attachment, leaving one upload orphaned in Library.
 * A request arriving mid-upload waits; only the newest waiting one runs, against the updated pointer.
 */
export function* syncArtifactAssetSerialized({ payload }: { payload: SyncArtifactAssetRequest }): SagaIterator<void> {
    const key = getArtifactSyncKey(payload);
    if (syncingArtifactKeys.has(key)) {
        pendingArtifactSyncRequests.set(key, payload);
        return;
    }

    syncingArtifactKeys.add(key);
    try {
        let next: SyncArtifactAssetRequest | undefined = payload;
        while (next) {
            try {
                yield call(syncArtifactAsset, { payload: next });
            } catch (error) {
                console.error('syncArtifactAsset: failed', {
                    conversationId: next.conversationId,
                    artifactId: next.artifactId,
                    error,
                });
            }
            next = pendingArtifactSyncRequests.get(key);
            pendingArtifactSyncRequests.delete(key);
        }
    } finally {
        syncingArtifactKeys.delete(key);
        pendingArtifactSyncRequests.delete(key);
    }
}
