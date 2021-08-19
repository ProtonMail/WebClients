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

export const updateOrganizationName = (Name: string) => ({
    url: 'organizations/name',
    method: 'put',
    data: { Name },
});

export const updateOrganizationEmail = (Email: string) => ({
    url: 'organizations/email',
    method: 'put',
    data: { Email },
});

export const updateOrganizationTheme = (Theme: string) => ({
    url: 'organizations/theme',
    method: 'put',
    data: { Theme },
});

export const updateTwoFactor = (GracePeriod: number) => ({
    url: 'organizations/2fa',
    method: 'put',
    data: { GracePeriod },
});

export interface UpdateOrganizationKeysPayloadLegacy {
    PrivateKey: string;
    BackupPrivateKey: string;
    BackupKeySalt: string;
    Tokens: { ID: string; Token: string }[];
}

export const updateOrganizationKeysLegacy = ({
    PrivateKey,
    BackupPrivateKey,
    BackupKeySalt,
    Tokens,
}: UpdateOrganizationKeysPayloadLegacy) => ({
    url: 'organizations/keys',
    method: 'post',
    data: { PrivateKey, BackupPrivateKey, BackupKeySalt, Tokens },
});

export interface UpdateOrganizationKeysPayloadV2 {
    PrivateKey: string;
    BackupPrivateKey: string;
    BackupKeySalt: string;
    Members: {
        ID: string;
        UserKeyTokens: {
            ID: string;
            Token: string;
        }[];
        AddressKeyTokens: {
            ID: string;
            Token: string;
            Signature: string;
            OrgSignature: string;
        }[];
    }[];
}

export const updateOrganizationKeysV2 = ({
    PrivateKey,
    BackupPrivateKey,
    BackupKeySalt,
    Members,
}: UpdateOrganizationKeysPayloadV2) => ({
    url: 'organizations/keys',
    method: 'post',
    data: { PrivateKey, BackupPrivateKey, BackupKeySalt, Members },
});

export const updateBackupKey = ({ PrivateKey, KeySalt }: { PrivateKey: string; KeySalt: string }) => ({
    url: 'organizations/keys/backup',
    method: 'post',
    data: { PrivateKey, KeySalt },
});

export const activateOrganizationKey = (PrivateKey: string) => ({
    url: 'organizations/keys/activate',
    method: 'put',
    data: { PrivateKey },
});
