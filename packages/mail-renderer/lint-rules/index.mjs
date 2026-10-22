import noDirectIframeAccess from './no-direct-iframe-access.mjs';

export default {
    meta: { name: 'mail-renderer' },
    rules: { 'no-direct-iframe-access': noDirectIframeAccess },
};
