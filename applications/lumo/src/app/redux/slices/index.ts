import contextFiltersReducer from './contextFilters';
import attachmentsReducer from './core/attachments';
import conversationsReducer from './core/conversations';
import credentialsReducer from './core/credentials';
import idMapReducer from './core/idmap';
import messagesReducer from './core/messages';
import spacesReducer from './core/spaces';
import ghostChatReducer from './ghostChat';
import eligibilityStatusReducer from './meta/eligibilityStatus';
import errorsReducer from './meta/errors';
import { remainingInvitesReducer } from './meta/remainingInvites';

export const lumoReducers = {
    spaces: spacesReducer,
    conversations: conversationsReducer,
    messages: messagesReducer,
    attachments: attachmentsReducer,
    credentials: credentialsReducer,
    idmap: idMapReducer,
    eligibilityStatus: eligibilityStatusReducer,
    errors: errorsReducer,
    contextFilters: contextFiltersReducer,
    ghostChat: ghostChatReducer,
    ...remainingInvitesReducer,
};
