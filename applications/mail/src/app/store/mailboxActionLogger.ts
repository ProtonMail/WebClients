import { isAction } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';

import { MAIL_LOG_COMPONENT, mailLogger } from 'proton-mail/mailLogger';

import { contextTotal, selectCurrentContextIdentifier } from './elements/elementsSelectors';
import type { MailState } from './rootReducer';

const TRACKED_ACTIONS = [
    'mailbox/markConversationsAsUnread/pending',
    'mailbox/markConversationsAsRead/pending',
    'mailbox/markMessagesAsUnread/pending',
    'mailbox/markMessagesAsRead/pending',
    'mailbox/labelConversations/pending',
    'mailbox/unlabelConversations/pending',
    'mailbox/labelMessages/pending',
    'mailbox/unlabelMessages/pending',
    'elements/showSerializedElements/',
    'elements/load/',
    'elements/eventUpdates/',
    'elements/setParams',
    'elements/reset',
] as const;

const shouldLogAction = (type: string) => {
    return TRACKED_ACTIONS.some((p) => type.startsWith(p));
};

const prepareLogData = (state: MailState, ctxIdentifier: string) => {
    return {
        ctxTotal: contextTotal(state),
        ctxTotals: state.elements.total,
        elementID: state.elements.params.elementID,
        messageID: state.elements.params.messageID,
        awaitingStaleRetry: state.elements.awaitingStaleRetry[ctxIdentifier] ?? false,
    };
};

const prepareContext = (state: MailState, ctxIdentifier: string) => ({
    labelID: state.elements.params.labelID,
    categoryIDs: state.elements.params.categoryIDs,
    conversationMode: state.elements.params.conversationMode,
    sort: state.elements.params.sort,
    filter: state.elements.params.filter,
    page: state.elements.page,
    pages: state.elements.pages[ctxIdentifier],
    esEnabled: state.elements.params.esEnabled,
    isSearching: state.elements.params.isSearching,
    pendingRequest: state.elements.pendingRequest,
    taskRunning: state.elements.taskRunning.labelIDs,
    elementCount: Object.keys(state.elements.elements).length,
    bypassFilerLength: state.elements.bypassFilter.length,
});

export const mailboxActionLogger: Middleware<{}, MailState> = (store) => (next) => (action) => {
    if (!isAction(action) || !mailLogger.isInitialized()) {
        return next(action);
    }

    if (!shouldLogAction(action.type)) {
        return next(action);
    }

    const beforeState = store.getState();
    const ctxIdentifier = selectCurrentContextIdentifier(beforeState);

    const before = prepareLogData(beforeState, ctxIdentifier);
    const result = next(action);

    const afterState = store.getState();
    const after = prepareLogData(afterState, ctxIdentifier);

    mailLogger.debug(MAIL_LOG_COMPONENT.MAILBOX_ACTIONS, action.type, {
        ...prepareContext(afterState, ctxIdentifier),
        ctxTotalBefore: before.ctxTotal,
        ctxTotalAfter: after.ctxTotal,
        awaitingStaleRetryBefore: before.awaitingStaleRetry,
        awaitingStaleRetryAfter: after.awaitingStaleRetry,
        elementID: after.elementID,
        messageID: after.messageID,
        tabTimeSeconds: (performance.now() / 1000).toFixed(2),
    });

    return result;
};
