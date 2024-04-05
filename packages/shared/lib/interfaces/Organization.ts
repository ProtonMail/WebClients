import { ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING, PLANS } from '@proton/shared/lib/constants';

export interface Organization {
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
}
