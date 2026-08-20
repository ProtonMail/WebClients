import { c } from 'ttag';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';

import HowItWorks from '../components/HowItWorks/HowItWorks';
import InviteSendEmail from './InviteSendEmail';
import InviteShareLink from './InviteShareLink';

export const InviteSection = () => {
    return (
        <>
            <DashboardGrid>
                <DashboardGridSectionHeader title={c('Label').t`Share your referral link`} />
            </DashboardGrid>
            <DashboardGrid columns={3}>
                <div className="flex flex-column gap-x-6 gap-y-4 xl:gap-y-6 grid-col-span-2">
                    <DashboardCard className="h-auto">
                        <DashboardCardContent>
                            <InviteShareLink />
                        </DashboardCardContent>
                    </DashboardCard>
                    <DashboardCard className="h-auto">
                        <DashboardCardContent>
                            <InviteSendEmail />
                        </DashboardCardContent>
                    </DashboardCard>
                </div>
                <DashboardCard>
                    <DashboardCardContent>
                        <HowItWorks />
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};
