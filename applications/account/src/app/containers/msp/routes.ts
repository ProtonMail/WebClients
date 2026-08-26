import { c } from 'ttag';

import type { SectionConfig, SidebarConfig } from '@proton/components';
import { IcBuildings } from '@proton/icons/icons/IcBuildings';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { APPS } from '@proton/shared/lib/constants';

import type { GeneralRouterParams } from '../../content/router-params';

export const getMspAppRoutes = ({ app, flags, entitlements, user }: GeneralRouterParams): SidebarConfig => {
    const { isMspEnabled = false } = flags;
    // MSP is exclusively available for Pass for now
    const isAllowedApp = app === APPS.PROTONPASS || app === APPS.PROTONACCOUNT;
    // MSP is exclusively available for passbiz2024 customers that have subsidiaries and members subsidiaries entitlements,
    // this is subject to change in the future
    const isEligible =
        !!entitlements.quantity(EntitlementName.PassBusiness) &&
        entitlements.orgHasSubsidiaries &&
        entitlements.orgHasMembersSubsidiaries;
    // The user can view companies page if they are an owner or have the IT manager permission
    // @todo: implement this when new MSP permissions are implemented
    const canViewCompanies = true;
    // The user can view monthly costs if they are the owner of the organization
    // @todo: implement this when new MSP permissions are implemented
    const canViewMonthlyCosts = user.isAdmin;
    return {
        available: isMspEnabled && isAllowedApp && isEligible && user.accessType !== AccessType.Msp,
        header: c('Settings section title').t`Managed Companies`,
        routes: {
            companies: {
                id: 'companies',
                text: c('Title').t`Companies`,
                to: '/companies',
                icon: IcBuildings,
                noTitle: true,
                available: canViewCompanies,
                subsections: [{ id: 'companies' }],
            },
            monthlyCosts: {
                id: 'monthlyCosts',
                text: c('Title').t`Monthly Costs`,
                to: '/monthly-costs',
                icon: IcMoneyBills,
                noTitle: true,
                available: canViewMonthlyCosts,
                subsections: [{ id: 'monthly-costs' }],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
