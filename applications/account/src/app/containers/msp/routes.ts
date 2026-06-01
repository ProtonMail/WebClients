import { c } from 'ttag';

import type { SectionConfig, SidebarConfig } from '@proton/components';

import type { GeneralRouterParams } from '../../content/router-params';

export const getMspAppRoutes = ({ flags }: GeneralRouterParams): SidebarConfig => {
    const { isMspEnabled = false } = flags;

    return {
        available: isMspEnabled,
        header: c('Settings section title').t`Managed Companies`,
        routes: {
            companies: {
                id: 'companies',
                text: c('Title').t`Companies`,
                description: c('Subtitle')
                    .t`With managed companies, you can add, edit, and remove access for organizations you oversee.`,
                to: '/companies',
                icon: 'buildings',
                available: true,
                subsections: [{ id: 'companies' }],
            },
            monthlyCosts: {
                id: 'monthlyCosts',
                text: c('Title').t`Monthly Costs`,
                description: c('Subtitle').t`Your total monthly cost for all managed companies.`,
                to: '/monthly-costs',
                icon: 'money-bills',
                available: true,
                subsections: [{ id: 'monthly-costs' }],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
