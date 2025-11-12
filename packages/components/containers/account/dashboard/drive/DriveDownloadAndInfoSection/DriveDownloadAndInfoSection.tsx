import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import DashboardUpgradePlanButton from '../../shared/DashboardDownloadSection/DashboardUpgradePlanButton';
import { getDownloadAppText } from '../../shared/DashboardMoreInfoSection/helpers';
import DriveDownloadSection from './DriveDownloadSection/DriveDownloadSection';
import DriveGetMoreSection from './DriveGetMoreSection/DriveGetMoreSection';

const DriveDownloadAndInfoSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();

    const plan = PLANS.BUNDLE;

    if (loadingSubscription || plansMapLoading) {
        return <Loader />;
    }

    const upgradeButton = <DashboardUpgradePlanButton app={app} plan={plan} key="upgrade-button" />;

    const planName = PLAN_NAMES[plan];
    const planMaxSpace = humanSize({ bytes: plansMap[plan]?.MaxSpace ?? 536870912000, unit: 'GB', fraction: 0 });
    const downloadsSubtitle = !subscription?.Plans
        ? c('Title')
              .jt`Get ${planMaxSpace} storage for your files, photos and documents with ${planName}. ${upgradeButton}`
        : c('Title').t`Manage files across devices on Windows, Mac, Android, and iOS.`;

    return (
        <DashboardGrid columns={2}>
            <DashboardGridSection position="header-left">
                <DashboardGridSectionHeader
                    title={getDownloadAppText(DRIVE_APP_NAME)}
                    subtitle={user.canPay ? downloadsSubtitle : null}
                />
            </DashboardGridSection>
            <DashboardGridSection position="content-left">
                <DriveDownloadSection />
            </DashboardGridSection>
            <DashboardGridSection position="header-right">
                <DashboardGridSectionHeader title={c('Title').t`Get more from your cloud storage`} />
            </DashboardGridSection>
            <DashboardGridSection position="content-right">
                <DriveGetMoreSection subscription={subscription} />
            </DashboardGridSection>
        </DashboardGrid>
    );
};

export default DriveDownloadAndInfoSection;
