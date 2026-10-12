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

export function* syncArtifactAsset({ payload }: { payload: SyncArtifactAssetRequest }): SagaIterator<void> {
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
