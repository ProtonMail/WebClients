export const createToken = (AddressId: string, Name: string) => ({
    method: 'post',
    url: 'mail/v4/smtptokens',
    data: {
        AddressId,
        Name,
    },
});

export const deleteToken = (tokenID: string) => ({
    method: 'delete',
    url: `mail/v4/smtptokens/${tokenID}`,
});

export const getTokens = () => ({
    method: 'get',
    url: 'mail/v4/smtptokens',
});
