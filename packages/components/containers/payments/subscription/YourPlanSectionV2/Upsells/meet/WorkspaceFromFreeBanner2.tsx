import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardGridSection } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import useLoad from '@proton/components/hooks/useLoad';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import { PLANS, PLAN_NAMES, hasFreeOrPlus, isManagedExternally } from '@proton/payments';
import { getExploreText } from '@proton/shared/lib/apps/i18n';
import {
    type APP_NAMES,
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DOCS_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    MEET_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    SHEETS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

import { PlanIcon } from '../../PlanIcon';

const BundleUpsellBanner = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const plan = PLANS.BUNDLE_PRO_2024;
    const planIsManagedExternally = isManagedExternally(subscription);

    useLoad();

    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;

    const loading = loadingSubscription || loadingPlans;

    if (!subscription || !plans || loading) {
        return null;
    }

    const showBanner = user.canPay && hasFreeOrPlus(subscription) && !planIsManagedExternally;

    if (!showBanner) {
        return null;
    }

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    return (
        <DashboardGridSection spanAll="footer">
            <PromotionBanner
                rounded="lg"
                mode="banner"
                gradient="vertical"
                contentCentered={false}
                description={
                    <div className="flex flex-nowrap items-center gap-3 p-1">
                        <PlanIcon planName={plan} />
                        <div className="text-left">
                            <b className="color-hint text-sm text-semibold">{c('Info').t`Did you know?`}</b>
                            <p className="m-0 text-lg color-norm">
                                {c('Upsell')
                                    .t`Everything you need to collaborate securely in a single subscription. Get access to ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${DOCS_SHORT_APP_NAME}, ${SHEETS_SHORT_APP_NAME}, ${MEET_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME} and ${LUMO_SHORT_APP_NAME} AI Assistant.`}{' '}
                            </p>
                        </div>
                    </div>
                }
                cta={
                    <Button
                        color="norm"
                        shape="ghost"
                        className="flex items-center gap-1 flex-nowrap"
                        onClick={handleGetPlan}
                    >
                        {getExploreText(PLAN_NAMES[plan])}
                        <IcArrowRight className="shrink-0" />
                    </Button>
                }
            />
        </DashboardGridSection>
    );
};

export default BundleUpsellBanner;
