import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import DashboardUpgradePlanButton from '../../shared/DashboardDownloadSection/DashboardUpgradePlanButton';
import { getDownloadAppText } from '../../shared/DashboardMoreInfoSection/helpers';
import MeetDownloadSection from './MeetDownloadSection/MeetDownloadSection';

// import MeetGetMoreSection from './MeetGetMoreSection/MeetGetMoreSection';

const MeetDownloadAndInfoSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();

    const plan = PLANS.MEET_BUSINESS;

    if (loadingSubscription) {
        return <Loader />;
    }

    const upgradeButton = <DashboardUpgradePlanButton app={app} plan={plan} key="upgrade-button" />;

    const planName = PLAN_NAMES[plan];
    const downloadsSubtitle = !subscription?.Plans
        ? c('Title').jt`Get unlimited meetings on all your devices with ${planName}. ${upgradeButton}`
        : undefined;

    return (
        <DashboardGrid columns={2}>
            <DashboardGridSection position="header-left">
                <DashboardGridSectionHeader
                    title={getDownloadAppText(MEET_APP_NAME)}
                    subtitle={user.canPay ? downloadsSubtitle : null}
                />
            </DashboardGridSection>
            <DashboardGridSection position="content-left">
                <MeetDownloadSection />
            </DashboardGridSection>
            {/* <DashboardGridSection position="header-right">
                <DashboardGridSectionHeader title={c('Title').t`Get more from ${BRAND_NAME}’s video conferencing`} />
            </DashboardGridSection>
            <DashboardGridSection position="content-right">
                <MeetGetMoreSection subscription={subscription} />
            </DashboardGridSection> */}
        </DashboardGrid>
    );
};

export default MeetDownloadAndInfoSection;
