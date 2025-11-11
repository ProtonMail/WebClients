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
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import DashboardUpgradePlanButton from '../../shared/DashboardDownloadSection/DashboardUpgradePlanButton';
import { getDownloadAppText } from '../../shared/DashboardMoreInfoSection/helpers';
import PassDownloadSection from './PassDownloadSection/PassDownloadSection';
import PassGetMoreSection from './PassGetMoreSection/PassGetMoreSection';

const PassDownloadAndInfoSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();

    const plan = PLANS.PASS;

    if (loadingSubscription) {
        return <Loader />;
    }

    const upgradeButton = <DashboardUpgradePlanButton app={app} plan={plan} key="upgrade-button" />;

    const passPlusPlanName = PLAN_NAMES[plan];
    const downloadsSubtitle = !subscription?.Plans
        ? c('Title').jt`Strengthen your security on all your devices with ${passPlusPlanName}. ${upgradeButton}`
        : c('Title').t`Get the app on all your devices and enjoy safe, seamless access anywhere.`;

    return (
        <DashboardGrid columns={2}>
            <DashboardGridSection position="header-left">
                <DashboardGridSectionHeader
                    title={getDownloadAppText(PASS_APP_NAME)}
                    subtitle={user.canPay ? downloadsSubtitle : null}
                />
            </DashboardGridSection>
            <DashboardGridSection position="content-left">
                <PassDownloadSection />
            </DashboardGridSection>
            <DashboardGridSection position="header-right">
                <DashboardGridSectionHeader title={c('Title').t`Get more from your password manager`} />
            </DashboardGridSection>
            <DashboardGridSection position="content-right">
                <PassGetMoreSection />
            </DashboardGridSection>
        </DashboardGrid>
    );
};

export default PassDownloadAndInfoSection;
