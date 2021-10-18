import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isScheduledSend, isSent, isDraft as testIsDraft } from '@proton/shared/lib/mail/messages';
import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';
import { parseLabelIDsInEvent } from '../../helpers/elements';
import { LabelIDsChanges, MessageEvent } from '../../models/event';
import { RootState } from '../store';
import { localID as localIDSelector } from './messagesSelectors';
import { MessagesState, MessageState } from './messagesTypes';

export const initialize = (state: Draft<MessagesState>, action: PayloadAction<MessageState>) => {
    state[action.payload.localID] = action.payload as any; // TS error with writing Element
};

export const event = (state: Draft<MessagesState>, action: PayloadAction<MessageEvent>) => {
    const { Action, Message } = action.payload;

    const localID = localIDSelector({ messages: state } as RootState, { ID: action.payload.ID });

    if (Action === EVENT_ACTIONS.DELETE) {
        delete state[localID];
    }
    if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
        const currentValue = state[localID] as MessageState;
        const isSentDraft = isSent(Message);
        const isScheduled = isScheduledSend(Message);
        const isDraft = testIsDraft(Message);

        if (currentValue.data) {
            const MessageToUpdate = parseLabelIDsInEvent(currentValue.data, Message as Message & LabelIDsChanges);

            // Draft updates can contains body updates but will not contains it in the event
            // By removing the current body value in the cache, we will reload it next time we need it
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                if (!currentValue.draftFlags?.sending) {
                    currentValue.messageDocument = undefined;
                    currentValue.data.Body = undefined;
                }

                if (isSentDraft && !isScheduled) {
                    Object.assign(currentValue.draftFlags, { isSentDraft: true });
                }
            }

            // If not a draft, numAttachment will never change, but can be calculated client side for PGP messages
            if (!isDraft) {
                delete (MessageToUpdate as Partial<Message>).NumAttachments;
            }

            Object.assign(currentValue.data, MessageToUpdate);
        }
    }
};
