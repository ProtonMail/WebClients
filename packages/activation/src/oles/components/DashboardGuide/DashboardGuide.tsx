import type { FC } from 'react';
import type React from 'react';

import { ImporterOrganizationsProvider } from '../../useImporterOrganizations';
import { ProviderTokensProvider } from '../../useProviderTokens';
import { DashboardCard } from './DashboardCard';

const DashboardGuide: FC = () => {
    return (
        <ImporterOrganizationsProvider>
            <ProviderTokensProvider>
                <DashboardCard />
            </ProviderTokensProvider>
        </ImporterOrganizationsProvider>
    );
};

export default DashboardGuide;
