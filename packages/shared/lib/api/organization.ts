import type { OrganizationSettings } from '../interfaces/Organization';
import type { OrganizationKeyActivation, OrganizationKeyInvitation } from '../keys/organizationKeyDto';

export const getOrganization = () => ({
    url: 'core/v4/organizations',
    method: 'get',
});

export const getOrganizationIdentity = () => ({
    url: 'core/v4/organizations/keys/signature',
    method: 'get',
});

export const getOrganizationKeys = () => ({
    url: 'core/v4/organizations/keys',
    method: 'get',
});

export const getOrganizationBackupKeys = () => ({
    url: 'core/v4/organizations/keys/backup',
    method: 'get',
});

export const getOrganizationLogo = (id: string) => ({
    url: `core/v4/organizations/logo/${id}`,
    method: 'get',
});

export const updateOrganizationName = (Name: string) => ({
    url: 'core/v4/organizations/name',
    method: 'put',
    data: { Name },
});

export const updateOrganizationLogo = (Image: string) => ({
    url: 'core/v4/organizations/settings/logo',
    method: 'post',
    data: { Image },
});

export const deleteOrganizationLogo = () => ({
    url: 'core/v4/organizations/settings/logo',
    method: 'delete',
});

export const updateOrganizationSettings = (data: {
    ShowName?: boolean;
    ShowScribeWritingAssistant?: boolean;
    VideoConferencingEnabled?: boolean;
    AllowedProducts?: OrganizationSettings['AllowedProducts'];
}) => ({
    url: 'core/v4/organizations/settings',
    method: 'put',
    data,
});

export const getOrganizationSettings = () => ({
    url: 'core/v4/organizations/settings',
    method: 'get',
});

export const updateOrganizationEmail = (Email: string) => ({
    url: 'core/v4/organizations/email',
    method: 'put',
    data: { Email },
});

export const updateOrganizationTheme = (Theme: string) => ({
    url: 'core/v4/organizations/theme',
    method: 'put',
    data: { Theme },
});

export const updateTwoFactor = (GracePeriod: number) => ({
    url: 'core/v4/organizations/2fa',
    method: 'put',
    data: { GracePeriod },
});

export interface GroupAddressKeyToken {
    ID: string;
    Token: string;
    OrgSignature: string;
}

export interface UpdateOrganizationKeysPayloadLegacy {
    PrivateKey: string;
    BackupPrivateKey: string;
    BackupKeySalt: string;
    Tokens: { ID: string; Token: string }[];
    GroupAddressKeyTokens: GroupAddressKeyToken[];
}

export const updateOrganizationKeysLegacy = ({
    PrivateKey,
    BackupPrivateKey,
    BackupKeySalt,
    Tokens,
    GroupAddressKeyTokens,
}: UpdateOrganizationKeysPayloadLegacy) => ({
    url: 'core/v4/organizations/keys',
    method: 'post',
    data: { PrivateKey, BackupPrivateKey, BackupKeySalt, Tokens, GroupAddressKeyTokens },
});

interface Members {
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
}

export interface UpdatePasswordlessOrganizationKeysPayload {
    PrivateKey: string;
    Signature: string;
    Token: string;
    Members: Members[];
    AdminInvitations: ({
        MemberID: string;
    } & OrganizationKeyInvitation)[];
    AdminActivations: ({
        MemberID: string;
    } & OrganizationKeyActivation)[];
    GroupAddressKeyTokens: GroupAddressKeyToken[];
}

export const createPasswordlessOrganizationKeys = (data: UpdatePasswordlessOrganizationKeysPayload) => ({
    url: 'core/v4/organizations/keys',
    method: 'post',
    data,
});

export const updatePasswordlessOrganizationKeys = (data: UpdatePasswordlessOrganizationKeysPayload) => ({
    ...createPasswordlessOrganizationKeys(data),
    method: 'put',
});

interface MigratePasswordlessOrganizationKeysPayload
    extends Omit<UpdatePasswordlessOrganizationKeysPayload, 'Members' | 'AdminInvitations' | 'GroupAddressKeyTokens'> {
    AdminInvitations: ({
        MemberID: string;
    } & OrganizationKeyActivation)[];
}

export const migratePasswordlessOrganizationKey = (data: MigratePasswordlessOrganizationKeysPayload) => ({
    url: 'core/v4/organizations/keys/migrate',
    method: 'post',
    data,
});

export interface UpdateOrganizationKeysPayloadV2 {
    PrivateKey: string;
    BackupPrivateKey: string;
    BackupKeySalt: string;
    Members: Members[];
    GroupAddressKeyTokens: GroupAddressKeyToken[];
}

export const updateOrganizationKeysV2 = ({
    PrivateKey,
    BackupPrivateKey,
    BackupKeySalt,
    Members,
}: UpdateOrganizationKeysPayloadV2) => ({
    url: 'core/v4/organizations/keys',
    method: 'post',
    data: { PrivateKey, BackupPrivateKey, BackupKeySalt, Members },
});

export const updateBackupKey = ({ PrivateKey, KeySalt }: { PrivateKey: string; KeySalt: string }) => ({
    url: 'core/v4/organizations/keys/backup',
    method: 'post',
    data: { PrivateKey, KeySalt },
});

export const activateOrganizationKey = (PrivateKey: string) => ({
    url: 'core/v4/organizations/keys/activate',
    method: 'put',
    data: { PrivateKey },
});

export const uploadOrganizationKeySignature = (data: { AddressID: string; Signature: string }) => ({
    url: 'core/v4/organizations/keys/signature',
    method: 'put',
    data,
});

export const leaveOrganisation = () => ({
    url: 'core/v4/organizations/membership',
    method: 'delete',
});

export const queryEnforceTwoFA = (Require: number) => ({
    url: `core/v4/organizations/require2fa`,
    method: 'put',
    data: { Require },
});

export const queryRemoveTwoFA = () => ({
    url: `core/v4/organizations/require2fa`,
    method: 'delete',
});

export const sendEmailReminderTwoFA = () => ({
    url: 'core/v4/organizations/2fa/remind',
    method: 'post',
});
