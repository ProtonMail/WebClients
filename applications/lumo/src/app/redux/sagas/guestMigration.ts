import type { PayloadAction } from '@reduxjs/toolkit';
import type { SagaIterator } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';

import type { GuestMigrationData } from '../../hooks/useGuestMigration';
import { addAttachment } from '../slices/core/attachments';
import { addConversation, pushConversationRequest } from '../slices/core/conversations';
import { addMessage, pushMessageRequest } from '../slices/core/messages';
import { addSpace, pushSpaceRequest } from '../slices/core/spaces';
import { importGuestDataFailure, importGuestDataRequest, importGuestDataSuccess } from '../slices/guestMigration';

function* importGuestDataSaga({ payload }: PayloadAction<GuestMigrationData>): SagaIterator {
    try {
        console.log('Starting guest data migration:', {
            conversation: payload.conversation?.id,
            messages: Object.keys(payload.messages || {}).length,
            attachments: Object.keys(payload.attachments || {}).length,
            space: payload.space?.id,
            activeConversationId: payload.activeConversationId,
        });

        const { conversation, messages, attachments, space, activeConversationId } = payload;

        // Import space first (conversation depends on it)
        if (space) {
            console.log('Importing space:', space.id);
            yield put(addSpace(space));
            // Let the normal flow handle encryption and persistence
            yield put(pushSpaceRequest({ id: space.id, priority: 'background' }));
        }

        // Import conversation
        if (conversation) {
            console.log('Importing conversation:', conversation.id);
            yield put(addConversation(conversation));
            yield put(pushConversationRequest({ id: conversation.id, priority: 'background' }));
        }

        // Import messages
        if (messages) {
            for (const message of Object.values(messages)) {
                console.log('Importing message:', message.id);
                yield put(addMessage(message));
                yield put(pushMessageRequest({ id: message.id, priority: 'background' }));
            }
        }

        // Import attachments
        if (attachments) {
            for (const attachment of Object.values(attachments)) {
                console.log('Importing attachment:', attachment.id);
                yield put(addAttachment(attachment));
                // Attachments will be handled by their parent messages
            }
        }

        yield put(importGuestDataSuccess({ activeConversationId }));

        console.log('Guest data migration completed successfully');
    } catch (error: any) {
        console.error('Guest data migration failed:', error);
        yield put(importGuestDataFailure({ error: error.message || 'Unknown migration error' }));
    }
}

export function* guestMigrationSaga() {
    yield takeEvery(importGuestDataRequest, importGuestDataSaga);
}
