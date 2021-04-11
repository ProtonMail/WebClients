import { G_OAUTH_CLIENT_ID, G_OAUTH_SCOPE, G_OAUTH_REDIRECT_PATH } from './constants';

const SEPARATOR_SPLIT_TOKEN = `##**${Date.now()}**##`;

export const splitEscaped = (s = '', separator = '/') => {
    if (separator !== '/') {
        return s.split(separator);
    }

    /*
        We initially used a Regex with negative lookbehind
        which caused problem with safari. This is the fix
        we came up with.
     */
    return s
        .split('\\/')
        .join(SEPARATOR_SPLIT_TOKEN)
        .split('/')
        .map((s) => s.split(SEPARATOR_SPLIT_TOKEN).join('\\/'));
};

export const escapeSlashes = (s = '') => splitEscaped(s).join('\\/');

export const unescapeSlashes = (s = '') => s.split('\\/').join('/');

export const getOAuthRedirectURL = () => {
    const { protocol, host } = window.location;
    return `${protocol}//${host}${G_OAUTH_REDIRECT_PATH}`;
};

export const getOAuthAuthorizationUrl = (email?: string) => {
    const params = new URLSearchParams();

    params.append('redirect_uri', getOAuthRedirectURL());
    params.append('response_type', 'code');
    params.append('access_type', 'offline');
    params.append('client_id', G_OAUTH_CLIENT_ID);
    params.append('scope', G_OAUTH_SCOPE);
    params.append('prompt', 'consent');

    if (email) {
        params.append('login_hint', email);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
