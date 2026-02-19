import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type {
    DocumentInitializeParams,
    LoadParams,
    MessageErrors,
    MessageState,
    MessagesState,
    VerificationParams,
} from '@proton/mail/store/messages/messagesTypes';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isScheduledSend, isSent, isDraft as testIsDraft } from '@proton/shared/lib/mail/messages';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import { parseLabelIDsInEvent } from '../../../helpers/elements';
import type { LabelIDsChanges, MessageEvent } from '../../../models/event';
import { getLocalID, getMessage } from '../helpers/messagesReducer';

export const reset = (state: Draft<MessagesState>) => {
    Object.keys(state).forEach((ID) => {
        delete state[ID];
    });
};

export const initialize = (state: Draft<MessagesState>, action: PayloadAction<MessageState>) => {
    const messageState = getMessage(state, action.payload.localID);

    if (!messageState?.messageDocument?.initialized) {
        state[action.payload.localID] = action.payload as any; // TS error with writing Element
    }
};

export const reload = (state: Draft<MessagesState>, { payload: { ID } }: PayloadAction<{ ID: string }>) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.messageDocument = undefined;
        messageState.decryption = undefined;
        messageState.errors = undefined;

        if (messageState.data) {
            delete messageState.data.Body;
        }
    }
};

export const errors = (
    state: Draft<MessagesState>,
    { payload: { ID, errors } }: PayloadAction<{ ID: string; errors: MessageErrors }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.errors = errors;
    }
};

export const event = (state: Draft<MessagesState>, action: PayloadAction<MessageEvent>) => {
    const { Action, Message } = action.payload;

    const localID = getLocalID(state, action.payload.ID);

    if (Action === EVENT_ACTIONS.DELETE) {
        delete state[localID];
    }
    if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
        const currentValue = state[localID] as MessageState | undefined;
        const isSentDraft = isSent(Message);
        const isScheduled = isScheduledSend(Message);
        const isDraft = testIsDraft(Message);

        if (currentValue?.data) {
            // If not a draft, numAttachment will never change, but can be calculated client side for PGP messages
            const messageUpdate = { ...Message };
            if (!isDraft) {
                delete (messageUpdate as Partial<Message>).NumAttachments;
            }

            currentValue.data = parseLabelIDsInEvent(currentValue.data, messageUpdate as Message & LabelIDsChanges);

            // Draft updates can contains body updates but will not contains it in the event
            // By removing the current body value in the cache, we will reload it next time we need it
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                // Also, if draft has already been sent, we don't want to reload the content of the message
                // Otherwise we would show the skeleton for a while, which seems weird since the message you sent should not change
                if (!currentValue.draftFlags?.sending && !isSentDraft) {
                    currentValue.messageDocument = undefined;
                    currentValue.messageImages = undefined;
                    currentValue.data.Body = undefined;
                }

                if (isSentDraft && !isScheduled) {
                    currentValue.draftFlags = {
                        ...currentValue.draftFlags,
                        isSentDraft: true,
                    };
                }
            }
        }
    }
};

export const loadFulfilled = (state: Draft<MessagesState>, { payload }: PayloadAction<Message>) => {
    const messageState = getMessage(state, payload.ID);

    if (messageState) {
        // Use current message.data in case the user is undoing send. We want to keep data like Password or Hint for example.
        messageState.data = {
            ...messageState.data,
            ...payload,
        };
        messageState.loadRetry = messageState.loadRetry ? messageState.loadRetry + 1 : 1;
    }
};

export const loadRejected = (
    state: Draft<MessagesState>,
    {
        meta: {
            arg: { ID },
        },
    }: PayloadAction<unknown, string, { arg: LoadParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.loadRetry = messageState.loadRetry ? messageState.loadRetry + 1 : 1;
    }
};

export const documentInitializePending = (state: Draft<MessagesState>, { payload }: PayloadAction<string>) => {
    const messageState = getMessage(state, payload);

    if (messageState) {
        messageState.messageDocument = { initialized: false };
    }
};

export const documentInitializeFulfilled = (
    state: Draft<MessagesState>,
    {
        payload: { ID, dataChanges, initialized, preparation, decryption, errors, messageImages },
    }: PayloadAction<DocumentInitializeParams>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.data = {
            ...(messageState.data as Message),
            ...dataChanges,
        };
        if (messageState.messageDocument) {
            messageState.messageDocument.initialized = initialized;
            messageState.messageDocument.document = preparation?.document;
            messageState.messageDocument.plainText = preparation?.plainText;
        }
        messageState.decryption = decryption;
        messageState.errors = errors;
        messageState.loadRetry = messageState.loadRetry ? messageState.loadRetry + 1 : 1;
        messageState.messageImages = messageImages;
    }
};

export const verificationComplete = (
    state: Draft<MessagesState>,
    {
        payload: { ID, verificationPreferences, verification, attachedPublicKeys, signingPublicKey, errors },
    }: PayloadAction<VerificationParams>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const senderPinnableKeys = verificationPreferences?.apiKeys.filter(
            (key) => !verificationPreferences?.pinnedKeysFingerprints?.has(key.getFingerprint())
        );
        const signingFingerprint = signingPublicKey?.getFingerprint();
        const signingPublicKeyIsPinned = signingFingerprint
            ? verificationPreferences?.pinnedKeysFingerprints?.has(signingFingerprint)
            : undefined;
        const signingPublicKeyIsCompromised = signingFingerprint
            ? verificationPreferences?.compromisedKeysFingerprints?.has(signingFingerprint)
            : undefined;
        messageState.verification = {
            // do not use compromised keys for verification
            senderPinnedKeys: verificationPreferences?.pinnedKeys,
            senderPinnableKeys,
            signingPublicKey,
            attachedPublicKeys,
            pinnedKeysVerified: verificationPreferences?.pinnedKeysVerified,
            verificationStatus: verification?.verificationStatus,
            verificationErrors: verification?.verificationErrors,
            ktVerificationResult: verificationPreferences?.ktVerificationResult,
            signingPublicKeyIsPinned,
            signingPublicKeyIsCompromised,
            apiKeysErrors: verificationPreferences?.apiKeysErrors,
            verifyingKeys: verificationPreferences?.verifyingKeys,
        };
        messageState.errors = { ...messageState.errors, ...errors };
    }
};

export const resign = (
    state: Draft<MessagesState>,
    { payload: { ID, isContactSignatureVerified } }: PayloadAction<{ ID: string; isContactSignatureVerified?: boolean }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.verification) {
        messageState.verification.pinnedKeysVerified = isContactSignatureVerified;
    }
};

export const resetVerification = (state: Draft<MessagesState>, { payload: emails }: PayloadAction<string[]>) => {
    Object.values(state).forEach((message) => {
        const senderAddress = canonicalizeEmail(message?.data?.Sender.Address || '');
        if (message && emails.includes(senderAddress)) {
            message.verification = undefined;
        }
    });
};

export const applyDarkStyle = (
    state: Draft<MessagesState>,
    { payload: { ID, hasDarkStyle } }: PayloadAction<{ ID: string; hasDarkStyle?: boolean }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.messageDocument) {
        messageState.messageDocument.hasDarkStyle = hasDarkStyle;
    }
};

export const removeDarkStyle = (
    state: Draft<MessagesState>,
    { payload: { ID, noDarkStyle } }: PayloadAction<{ ID: string; noDarkStyle?: boolean }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.messageDocument) {
        messageState.messageDocument.noDarkStyle = noDarkStyle;
    }
};

export const cleanUTMTrackers = (
    state: Draft<MessagesState>,
    { payload: { ID, utmTrackers } }: PayloadAction<{ ID: string; utmTrackers: MessageUTMTracker[] }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.messageUTMTrackers = utmTrackers;
    }
};
