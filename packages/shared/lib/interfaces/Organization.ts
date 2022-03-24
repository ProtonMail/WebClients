export interface Organization {
    Name: string;
    DisplayName: string; // DEPRECATED
    PlanName: string;
    VPNPlanName: string;
    TwoFactorGracePeriod: number; // If non-null, number of seconds until 2FA setup enforced
    Theme: string;
    ToMigrate: 0 | 1;
    BrokenSKL: 0 | 1;
    Email: string;
    MaxDomains: number;
    MaxAddresses: number;
    MaxSpace: number;
    MaxMembers: number;
    MaxVPN: number;
    Features: number; // bits: 1 = catch-all addresses
    Flags: number; // bits: 1 = loyalty, 2 = covid, 64 = dissident, 128 = proton
    UsedDomains: number;
    UsedAddresses: number;
    UsedSpace: number;
    AssignedSpace: number;
    UsedMembers: number;
    UsedVPN: number;
    HasKeys: number;
    CreateTime: number;
    LoyaltyCounter: number;
    LoyaltyIncrementTime: number;
    BonusDomains: number;
    BonusAddresses: number;
    BonusSpace: number;
    BonusMembers: number;
    BonusVPN: number;
}
