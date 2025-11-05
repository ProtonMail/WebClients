import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import MailDownloadSection from './MailDownloadSection/MailDownloadSection';
import { MailGetMoreSection } from './MailGetMoreSection/MailGetMoreSection';

export const MailDownloadAndInfoSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const plan = PLANS.MAIL;

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    if (loadingSubscription) {
        return <Loader />;
    }

    const upgradeButton = (
        <Button
            size="small"
            shape="underline"
            color="norm"
            onClick={handleExplorePlans}
            data-testid="cta:upgrade-plan"
            key="upgrade-button"
        >
            {c('specialoffer: Link').t`Upgrade`}
        </Button>
    );

    const mailPlusPlanName = PLAN_NAMES[plan];
    const downloadsSubtitle = !subscription?.Plans
        ? c('Title').jt`Get access to the desktop app with ${mailPlusPlanName}. ${upgradeButton}`
        : c('Title').t`Enjoy fast, seamless access to your emails with our dedicated apps.`;

    return (
        <DashboardGrid columns={2}>
            <DashboardGridSection position="header-left">
                <DashboardGridSectionHeader
                    title={c('Title').t`Download ${MAIL_APP_NAME} and ${CALENDAR_APP_NAME}`}
                    subtitle={user.canPay ? downloadsSubtitle : null}
                />
            </DashboardGridSection>
            <DashboardGridSection position="content-left">
                <MailDownloadSection />
            </DashboardGridSection>
            <DashboardGridSection position="header-right">
                <DashboardGridSectionHeader title={c('Title').t`Get more from your email`} />
            </DashboardGridSection>
            <DashboardGridSection position="content-right">
                <MailGetMoreSection subscription={subscription} />
            </DashboardGridSection>
        </DashboardGrid>
    );
};

export default MailDownloadAndInfoSection;
