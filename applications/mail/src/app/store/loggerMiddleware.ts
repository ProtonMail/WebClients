import { isAction } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';

import { loggerManager } from '@proton/shared/lib/logger';

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

const prepareLogData = (state: MailState) => {
    return {
        ctxTotal: contextTotal(state),
        ctxTotals: state.elements.total,
        elementID: state.elements.params.elementID,
        messageID: state.elements.params.messageID,
        awaitingStaleRetry: state.elements.awaitingStaleRetry,
    };
};

const prepareContext = (state: MailState) => ({
    labelID: state.elements.params.labelID,
    categoryIDs: state.elements.params.categoryIDs,
    conversationMode: state.elements.params.conversationMode,
    sort: state.elements.params.sort,
    filter: state.elements.params.filter,
    page: state.elements.page,
    pages: state.elements.pages,
    esEnabled: state.elements.params.esEnabled,
    isSearching: state.elements.params.isSearching,
    pendingRequest: state.elements.pendingRequest,
    taskRunning: state.elements.taskRunning.labelIDs,
    elementCount: Object.keys(state.elements.elements).length,
    bypassFilerLength: state.elements.bypassFilter.length,
});

const reduxLogger = loggerManager.getLogger('redux');

export const loggerMiddleware: Middleware<{}, MailState> = (store) => (next) => (action) => {
    if (!isAction(action) || !reduxLogger.isInitialized()) {
        return next(action);
    }

    if (!shouldLogAction(action.type)) {
        return next(action);
    }

    const before = prepareLogData(store.getState());
    const result = next(action);

    const afterState = store.getState();
    const after = prepareLogData(afterState);

    reduxLogger.debug(
        action.type,
        JSON.stringify({
            ctxIdentifier: selectCurrentContextIdentifier(afterState),
            context: prepareContext(afterState),
            tabTime: performance.now() / 1000,
            before,
            after,
        })
    );

    return result;
};
