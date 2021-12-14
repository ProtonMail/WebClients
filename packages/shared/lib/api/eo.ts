export const getEOToken = (id: string) => ({
    method: 'get',
    url: `mail/v4/eo/token/${id}`,
});

export const getEOMessage = (decryptedToken: string, id: string) => ({
    method: 'get',
    url: `mail/v4/eo/message`,
    headers: {
        Authorization: decryptedToken,
        'x-eo-uid': id,
    },
});

export const getEOAttachment = (attachmentId: string, decryptedToken: string, id: string) => ({
    method: 'get',
    url: `mail/v4/eo/attachment/${attachmentId}`,
    headers: {
        Authorization: decryptedToken,
        'x-eo-uid': id,
    },
    output: 'arrayBuffer',
});
