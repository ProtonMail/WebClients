import { type PLANS } from '@proton/payments';
import type { Product } from '@proton/shared/lib/ProductEnum';
import type { ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';

import type { PasswordPolicySettings } from './PasswordPolicy';

export interface Organization {
    ID: string;
    Name: string;
    DisplayName: string; // DEPRECATED
    PlanName: PLANS;
    VPNPlanName: string;
    TwoFactorRequired: ORGANIZATION_TWOFA_SETTING; // If 0, 2FA not required, if 1, 2FA required for admins only, if 2, 2FA required for all
    TwoFactorGracePeriod: number; // If non-null, number of seconds until 2FA setup enforced
    Theme: string;
    ToMigrate: 0 | 1 | 2;
    BrokenSKL: 0 | 1;
    Email: string;
    MaxDomains: number;
    MaxAddresses: number;
    MaxCalendars: number;
    MaxSpace: number;
    MaxMembers: number;
    MaxAI: number;
    MaxLumo: number;
    MaxWallets: number;
    MaxSubWallets: number;
    IsScimEnabled: boolean;
    MaxVPN: number;
    Features: number; // bits: 1 = catch-all addresses
    Flags: number; // bits: 1 = loyalty, 2 = covid, 4 = smtp_submission, 8 = no_cycle_scheduled, 64 = dissident, 128 = proton, 256 = has phone support
    UsedDomains: number;
    UsedCalendars: number;
    RequiresKey: number; // greater than 0 if the organization requires a key to be setup
    RequiresDomain: number; // greater than 0 of the organization requires custom domain
    UsedAddresses: number;
    UsedSpace: number;
    AssignedSpace: number;
    UsedMembers: number;
    UsedVPN: number;
    UsedAI: number;
    UsedLumo: number;
    InvitationsRemaining: number;
    HasKeys: number;
    CreateTime: number;
    LoyaltyCounter: number;
    LoyaltyIncrementTime: number;
    BonusDomains: number;
    BonusAddresses: number;
    BonusSpace: number;
    BonusMembers: number;
    BonusVPN: number;
    Permissions: number;
    State: ORGANIZATION_STATE;
    IsBusiness: boolean;
}

export interface OrganizationIdentityOutput {
    PublicKey: string | null;
    FingerprintSignature: string | null;
    FingerprintSignatureAddress: string | null;
}

export type OrganizationSettingsAllowedProduct = Extract<
    Product,
    'Mail' | 'Calendar' | 'VPN' | 'Pass' | 'Drive' | 'Wallet' | 'Lumo'
>;

export type SerializedOrganizationSettingsAllowedProduct = OrganizationSettingsAllowedProduct | 'All';

export interface OrganizationSettings {
    ShowName: boolean;
    LogoID: string | null;
    ShowScribeWritingAssistant: boolean;
    VideoConferencingEnabled: boolean;
    AllowedProducts: SerializedOrganizationSettingsAllowedProduct[];
    // Settings for admin
    PasswordPolicies: PasswordPolicySettings;
    LogAuth: number; // 0 = no logging, 1 = loging default, 2 = loging detailed auth
    HighSecurity: number; // 0 = no high security, 1 = high security enable
}

export interface OrganizationExtended extends Organization {
    Settings: OrganizationSettings;
}
