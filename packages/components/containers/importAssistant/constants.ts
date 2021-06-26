export const G_OAUTH_CLIENT_ID = '923746734024-4rggv7tvusv9c0fi9tvh5elnuj5o067b.apps.googleusercontent.com';

export const G_OAUTH_REDIRECT_PATH = '/oauth/callback';

const G_OAUTH_SCOPE_DEFAULT = ['email', 'openid'];

export const G_OAUTH_SCOPE_MAIL = [...G_OAUTH_SCOPE_DEFAULT, 'https://mail.google.com/'].join(' ');
export const G_OAUTH_SCOPE_CONTACTS = [
    ...G_OAUTH_SCOPE_DEFAULT,
    'https://www.googleapis.com/auth/contacts.other.readonly',
    'https://www.googleapis.com/auth/contacts.readonly',
].join(' ');
export const G_OAUTH_SCOPE_CALENDAR = [
    ...G_OAUTH_SCOPE_DEFAULT,
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
].join(' ');

export const OAUTH_TEST_IDS = [
    'cxinT4HnEQpRz7FHRiGu7CjH9pFULfMwqHc9mv65yycL99EohZgfRP7eMbBUMlEZG4Ks_yszjrcMzDeKD2No6w==',
    'ddjZNL8VtjZIOVR6tenP3u1Yj9s-hRLPFHuK-iDPnJunIano7ExK27dZGG41Z7t-4NQ_JJB1W2pK1N6dgEuVTA==',
    'hFe07LzzAjBB4HxpAZnIiK7nUIja1qXkdOGPAlPeToHDKd7KlFvovGzZD13Ylp1DrJ00wJkqifz58YeYlVmxFg==',
];
