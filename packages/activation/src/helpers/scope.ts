import {
    G_OAUTH_SCOPE_DEFAULT,
    G_OAUTH_SCOPE_MAIL_FULL_SCOPE,
    G_OAUTH_SCOPE_PROFILE,
    SYNC_G_OAUTH_SCOPES,
} from '@proton/activation/src/constants';

export const getBYOEScope = () => {
    return [...G_OAUTH_SCOPE_DEFAULT, ...G_OAUTH_SCOPE_MAIL_FULL_SCOPE, ...G_OAUTH_SCOPE_PROFILE].join(' ');
};

export const getForwardingScope = () => {
    return SYNC_G_OAUTH_SCOPES.join(' ');
};
