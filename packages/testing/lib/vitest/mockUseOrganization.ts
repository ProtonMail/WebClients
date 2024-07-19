import * as useOrganizationModule from '@proton/account/organization/hooks';
import type { OrganizationWithSettings } from '@proton/shared/lib/interfaces';

export const mockUseGetOrganization = (value: Partial<OrganizationWithSettings> = {}) => {
    const spy = vi.spyOn(useOrganizationModule, 'useGetOrganization');
    spy.mockReturnValue(
        vi.fn(
            async () =>
                ({
                    Name: '',
                    DisplayName: '',
                    PlanName: 'bundle2022',
                    PlanFlags: 7,
                    TwoFactorRequired: 0,
                    TwoFactorGracePeriod: null,
                    Theme: null,
                    Email: null,
                    Note: 0,
                    MaxDomains: 3,
                    MaxAddresses: 15,
                    MaxCalendars: 25,
                    MaxSpace: 536870912000,
                    MaxMembers: 1,
                    MaxVPN: 10,
                    MaxAI: 0,
                    Features: 1,
                    Flags: 0,
                    CreateTime: 1676033386,
                    LoyaltyCounter: 0,
                    LoyaltyIncrementTime: 1707569386,
                    BonusDomains: 0,
                    BonusAddresses: 0,
                    BonusSpace: 0,
                    BonusMembers: 0,
                    BonusVPN: 0,
                    UsedDomains: 0,
                    UsedAddresses: 0,
                    UsedCalendars: 0,
                    UsedSpace: 464014,
                    AssignedSpace: 536870912000,
                    UsedMembers: 1,
                    UsedVPN: 10,
                    UsedAI: 0,
                    HasKeys: 0,
                    ToMigrate: 0,
                    BrokenSKL: 0,
                    Settings: {
                        ShowName: true,
                        LogoID: null,
                    },
                    ...value,
                }) as OrganizationWithSettings
        )
    );
    return spy;
};
