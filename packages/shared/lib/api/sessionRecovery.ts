export const initiateSessionRecovery = () => ({
    url: 'account/v1/recovery/session',
    method: 'POST',
});

export const abortSessionRecovery = () => ({
    url: 'account/v1/recovery/session/abort',
    method: 'POST',
});

export const consumeSessionRecovery = (data: {
    UserKeys: {
        ID: string;
        PrivateKey: string;
    }[];
    KeySalt: string;
    OrganizationKey?: string;
}) => ({
    url: 'account/v1/recovery/session/consume',
    method: 'POST',
    data,
});

export const updateSessionAccountRecovery = (data: { SessionAccountRecovery: 0 | 1 }) => ({
    url: 'core/v4/settings/sessionaccountrecovery',
    method: 'PUT',
    data,
});
