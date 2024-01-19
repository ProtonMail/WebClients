export const mailIgnoredPaths = [
    /^attachments/,
    /^conversations\.[a-zA-Z0-9=_-]*\.errors/,
    /^elements.retry.error/,
    /^messages\.[a-zA-Z0-9=_-]*\.data.Attachments/,
    /^messages\.[a-zA-Z0-9=_-]*\.data.Packages/,
    /^messages\.[a-zA-Z0-9=_-]*\.decryption/,
    /^messages\.[a-zA-Z0-9=_-]*\.draftFlags.expiresIn/,
    /^messages\.[a-zA-Z0-9=_-]*\.errors/,
    /^messages\.[a-zA-Z0-9=_-]*\.messageDocument.document/,
    /^messages\.[a-zA-Z0-9=_-]*\.messageImages.images/,
    /^messages\.[a-zA-Z0-9=_-]*\.verification/,
];

export const mailIgnoredActionPaths = [
    'meta.arg',
    'payload.abortController',
    'payload.preparation',
    'payload.decryption',
    'payload',
    'payload.attachment',
    'payload.contacts',
    'payload.contactGroups',
    'payload.result.abortController',
];
