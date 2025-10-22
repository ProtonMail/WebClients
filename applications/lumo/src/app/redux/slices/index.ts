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
import initializationReducer from './meta/initialization';
import { remainingInvitesReducer } from './meta/remainingInvites';
import personalizationReducer from './personalization';
import lumoUserSettingsReducer from './lumoUserSettings';

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
    personalization: personalizationReducer,
    lumoUserSettings: lumoUserSettingsReducer,
    initialization: initializationReducer,
    ...remainingInvitesReducer,
};
