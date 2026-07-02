export type ProtocolSource = 'ipc' | 'redirect';

// BASELINE_ALLOWED_PROTOCOLS are protocols allowed to be opened in the browser with user confirmation
// They are coming directly from buttons/links that send out an 'openExternal' IPC message
export const BASELINE_ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'webcal:', 'webdav:'];

// BASELINE_ALLOWED_CONTENT_PROTOCOLS are protocols allowed to be opened in the browser without user confirmation
// The source of these are coming from redirects, href links etc...
export const BASELINE_ALLOWED_CONTENT_PROTOCOLS = [
    ...BASELINE_ALLOWED_PROTOCOLS,
    'sms:',
    'callto:',
    'xmpp:',
    'ftp:',
    'ftps:',
];
