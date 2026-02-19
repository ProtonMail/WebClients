import { attachmentLoadingStateReducer } from './attachmentLoadingState';
import contextFiltersReducer from './contextFilters';
import attachmentsReducer from './core/attachments';
import conversationsReducer from './core/conversations';
import credentialsReducer from './core/credentials';
import idMapReducer from './core/idmap';
import messagesReducer from './core/messages';
import spacesReducer from './core/spaces';
import featureFlagsReducer from './featureFlags';
import ghostChatReducer from './ghostChat';
import lumoUserSettingsReducer from './lumoUserSettings';
import eligibilityStatusReducer from './meta/eligibilityStatus';
import errorsReducer from './meta/errors';
import initializationReducer from './meta/initialization';
import { remainingInvitesReducer } from './meta/remainingInvites';
import personalizationReducer from './personalization';

export const lumoReducers = {
    spaces: spacesReducer,
    conversations: conversationsReducer,
    messages: messagesReducer,
    attachments: attachmentsReducer,
    attachmentLoadingState: attachmentLoadingStateReducer,
    credentials: credentialsReducer,
    idmap: idMapReducer,
    eligibilityStatus: eligibilityStatusReducer,
    errors: errorsReducer,
    contextFilters: contextFiltersReducer,
    ghostChat: ghostChatReducer,
    personalization: personalizationReducer,
    featureFlags: featureFlagsReducer,
    lumoUserSettings: lumoUserSettingsReducer,
    initialization: initializationReducer,
    ...remainingInvitesReducer,
};
