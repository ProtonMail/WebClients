import { c } from 'ttag';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';

const AuthenticatorDownloadsSettingsPage = () => {
    return (
        <DashboardGrid>
            <DashboardGridSectionHeader title={c('Headline').t`Downloads`} />
            <DashboardCard>
                <DashboardCardContent>Downloads here</DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};

export default AuthenticatorDownloadsSettingsPage;
