import { c } from 'ttag';

import type { SectionConfig, SidebarConfig } from '@proton/components';
import { hasMspEligiblePlan } from '@proton/payments';

import type { GeneralRouterParams } from '../../content/router-params';

export const getMspAppRoutes = ({ flags, subscription }: GeneralRouterParams): SidebarConfig => {
    const { isMspEnabled = false } = flags;

    return {
        available: isMspEnabled && hasMspEligiblePlan(subscription),
        header: c('Settings section title').t`Managed Companies`,
        routes: {
            companies: {
                id: 'companies',
                text: c('Title').t`Companies`,
                to: '/companies',
                icon: 'buildings',
                noTitle: true,
                available: true,
                subsections: [{ id: 'companies' }],
            },
            monthlyCosts: {
                id: 'monthlyCosts',
                text: c('Title').t`Monthly Costs`,
                to: '/monthly-costs',
                icon: 'money-bills',
                noTitle: true,
                available: true,
                subsections: [{ id: 'monthly-costs' }],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
