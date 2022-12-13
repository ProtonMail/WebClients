export const createToken = (AddressID: string, Name: string) => ({
    method: 'post',
    url: 'mail/v4/smtptokens',
    data: {
        AddressID,
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
