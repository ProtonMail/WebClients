export const getOrganization = () => ({
    url: 'organizations',
    method: 'get',
});

export const getOrganizationKeys = () => ({
    url: 'organizations/keys',
    method: 'get',
});

export const getOrganizationBackupKeys = () => ({
    url: 'organizations/keys/backup',
    method: 'get',
});

export const updateOrganizationName = (Name) => ({
    url: 'organizations/name',
    method: 'put',
    data: { Name },
});

export const updateOrganizationEmail = (Email) => ({
    url: 'organizations/email',
    method: 'put',
    data: { Email },
});

export const updateOrganizationTheme = (Theme) => ({
    url: 'organizations/theme',
    method: 'put',
    data: { Theme },
});

export const updateTwoFactor = (GracePeriod) => ({
    url: 'organizations/2fa',
    method: 'put',
    data: { GracePeriod },
});

export const updateOrganizationKeys = ({ PrivateKey, BackupPrivateKey, BackupKeySalt, Tokens }) => ({
    url: 'organizations/keys',
    method: 'post',
    data: { PrivateKey, BackupPrivateKey, BackupKeySalt, Tokens },
});

export const updateBackupKey = ({ PrivateKey, KeySalt }) => ({
    url: 'organizations/keys/backup',
    method: 'post',
    data: { PrivateKey, KeySalt },
});

export const activateOrganizationKey = (PrivateKey) => ({
    url: 'organizations/keys/activate',
    method: 'put',
    data: { PrivateKey },
});
