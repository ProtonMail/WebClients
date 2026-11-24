import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Loader } from '@proton/atoms/Loader/Loader';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import DashboardUpgradePlanButton from '../../shared/DashboardDownloadSection/DashboardUpgradePlanButton';
import { getDownloadAppText } from '../../shared/DashboardMoreInfoSection/helpers';
import MeetDownloadSection from './MeetDownloadSection/MeetDownloadSection';

const MeetDownloadAndInfoSection = () => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();

    const plan = PLANS.MEET_BUSINESS;

    if (loadingSubscription) {
        return <Loader />;
    }

    const upgradeButton = <DashboardUpgradePlanButton plan={plan} key="upgrade-button" />;

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
        </DashboardGrid>
    );
};

export default MeetDownloadAndInfoSection;
