import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getSimplePriceString } from '@proton/payments/core/price-format';
import type { FullPlansMap, Subscription } from '@proton/payments/core/subscription/interface';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    DUO_MAX_USERS,
    FAMILY_MAX_USERS,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { FreePlanDefault } from '@proton/shared/lib/payments/plan/interface';

import { useModalStateObject } from '../../../../../../components/modalTwo/useModalState';
import useDashboardPaymentFlow from '../../../../../../hooks/useDashboardPaymentFlow';
import { useSubscriptionModal } from '../../../subscriptionModalContext';
import { useSubscriptionPriceComparison } from '../helper';
import type { PlanOfferFeature } from './PlanOfferCard';
import PlanOfferCard from './PlanOfferCard';
import PlanUpgradeModal from './PlanUpgradeModal';
import {
    getSubscribersOnlyLabel,
    getUltraServersFeatureText,
    getUltraServersTooltip,
    getVisionaryCardDescription,
    getVisionaryTitle,
    getVisionaryUpsellSubscriberPlan,
} from './helpers';
import type { VisionaryUpsellCta } from './telemetry';
import { sendVisionaryUpsellCtaClick } from './telemetry';

type OfferedPlanName = PLANS.VISIONARY | PLANS.BUNDLE;

const getDiscoverText = (planName: string) => c('Action').t`Discover ${planName}`;

const getIncludedAppsText = () => {
    const meet = PLAN_NAMES[PLANS.MEET];
    const lumo = PLAN_NAMES[PLANS.LUMO];
    // translator: ${meet} is "Meet Professional", ${lumo} is "Lumo Plus"
    return c('Visionary upsell').t`${meet}, ${lumo} and Scribe included`;
};

/** Card shown next to the Visionary one */
type VisionaryUpsellCompanion = 'unlimited' | 'groupPlans' | 'family';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription;
    plansMap: FullPlansMap;
    freePlan: FreePlanDefault;
    /** `solo` shows Visionary alone, at full width */
    variant: 'full' | 'compact' | 'solo';
    companion?: VisionaryUpsellCompanion;
    showSectionHeader?: boolean;
}

const VisionaryUpsellCards = ({
    app,
    user,
    subscription,
    plansMap,
    freePlan,
    variant,
    companion,
    showSectionHeader = false,
}: Props) => {
    const api = useApi();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const visionaryModal = useModalStateObject();
    const unlimitedModal = useModalStateObject();
    const { cheapestMonthlyPrice } = useSubscriptionPriceComparison(app, subscription, PLANS.FAMILY);

    const subscriberPlan = getVisionaryUpsellSubscriberPlan(subscription);
    if (!subscriberPlan) {
        return null;
    }

    const isVisionary = (plan: OfferedPlanName) => plan === PLANS.VISIONARY;
    const getModal = (plan: OfferedPlanName) => (isVisionary(plan) ? visionaryModal : unlimitedModal);
    const sendCtaClick = (cta: VisionaryUpsellCta) => sendVisionaryUpsellCtaClick({ api, app, user, cta });

    const handleDiscover = (plan: OfferedPlanName) => {
        sendCtaClick(isVisionary(plan) ? 'discover_visionary' : 'discover_unlimited_card');
        getModal(plan).openModal(true);
    };

    const handleUpgrade = (plan: OfferedPlanName) => {
        getModal(plan).openModal(false);
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan,
            cycle: CYCLE.YEARLY,
            telemetryFlow,
        });
    };

    const handleComparePlans = (plan: OfferedPlanName) => {
        sendCtaClick(isVisionary(plan) ? 'compare_plans_visionary_window' : 'compare_plans_unlimited_window');
        getModal(plan).openModal(false);
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            // Visionary is listed with the family plans
            defaultAudience: isVisionary(plan) ? Audience.FAMILY : undefined,
            telemetryFlow,
        });
    };

    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            telemetryFlow,
        });
    };

    const handleExploreGroupPlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            defaultAudience: Audience.FAMILY,
            telemetryFlow,
        });
    };

    const isFull = variant === 'full';
    const unlimitedName = PLAN_NAMES[PLANS.BUNDLE];
    const visionaryName = getVisionaryTitle();
    const familyName = PLAN_NAMES[PLANS.FAMILY];

    const visionaryStorage = humanSize({
        bytes: plansMap[PLANS.VISIONARY]?.MaxSpace ?? 0,
        fraction: 0,
        unitOptions: { max: 'TB' },
    });

    const visionaryFeatures: PlanOfferFeature[] = [
        { id: 'ultra-servers', text: getUltraServersFeatureText(), tooltip: getUltraServersTooltip() },
        { id: 'storage', text: c('Visionary upsell').t`${visionaryStorage} storage` },
        { id: 'included-apps', text: getIncludedAppsText() },
        { id: 'new-services', text: c('Visionary upsell').t`New ${BRAND_NAME} services at no extra cost` },
        { id: 'early-access', text: c('Visionary upsell').t`Early access to new features` },
    ];

    const unlimitedFeatures: PlanOfferFeature[] = [
        { id: 'mail', text: c('Plan card').t`Secure email that protects your privacy` },
        { id: 'drive', text: c('Plan card').t`Encrypted cloud storage for photos and files` },
        { id: 'vpn', text: c('Plan card').t`Your gateway to online freedom` },
        { id: 'pass', text: c('Plan card').t`Password manager with identity protection` },
    ];

    const priceString = cheapestMonthlyPrice
        ? getSimplePriceString(subscription.Currency, cheapestMonthlyPrice / FAMILY_MAX_USERS)
        : undefined;

    const companionCard = (() => {
        if (variant === 'solo') {
            return null;
        }
        if (companion === 'groupPlans') {
            return (
                <PlanOfferCard
                    planName={PLANS.DUO}
                    variant="compact"
                    title={c('Visionary upsell').t`Group plans`}
                    description={
                        // translator: typical sentence is: You can protect up to 2 people with Proton Duo, and up to 6 with Proton Family. From only $4.00/month per account.
                        priceString &&
                        c('Upsell')
                            .t`You can protect up to ${DUO_MAX_USERS} people with ${PLAN_NAMES[PLANS.DUO]}, and up to ${FAMILY_MAX_USERS} with ${PLAN_NAMES[PLANS.FAMILY]}. From only ${priceString}/month per account.`
                    }
                    ctaLabel={c('Action').t`Explore group plans`}
                    onCta={handleExploreGroupPlans}
                    loading={loadingSubscriptionModal}
                    reserveBandSpace
                    data-testid="group-plans-card"
                />
            );
        }
        if (companion === 'family') {
            const plan = PLANS.FAMILY;
            return (
                <PlanOfferCard
                    planName={PLANS.FAMILY}
                    variant="compact"
                    title={familyName}
                    description={
                        priceString &&
                        c('Upsell')
                            .t`You can protect up to ${FAMILY_MAX_USERS} people with ${PLAN_NAMES[plan]}. Starting from just ${priceString}/month per account.`
                    }
                    ctaLabel={getDiscoverText(familyName)}
                    onCta={handleExploreGroupPlans}
                    loading={loadingSubscriptionModal}
                    reserveBandSpace
                    data-testid="family-card"
                />
            );
        }
        return (
            <PlanOfferCard
                planName={PLANS.BUNDLE}
                variant={isFull ? 'full' : 'compact'}
                title={unlimitedName}
                description={c('Plan description')
                    .t`All premium features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`}
                features={unlimitedFeatures}
                ctaLabel={getDiscoverText(unlimitedName)}
                onCta={() => handleDiscover(PLANS.BUNDLE)}
                reserveBandSpace
                data-testid="unlimited-card"
            />
        );
    })();

    return (
        <DashboardGrid>
            {showSectionHeader && (
                <DashboardGridSectionHeader
                    title={c('Title').t`Get complete privacy coverage`}
                    cta={
                        <Button color="norm" shape="ghost" onClick={handleExplorePlans}>
                            {c('Action').t`Compare all plans`}
                            <IcChevronRight className="shrink-0 ml-1 rtl:mirror" />
                        </Button>
                    }
                />
            )}
            <div className="flex flex-column md:flex-row flex-nowrap gap-4">
                {companionCard}
                <PlanOfferCard
                    planName={PLANS.VISIONARY}
                    variant={variant}
                    title={visionaryName}
                    description={getVisionaryCardDescription()}
                    band={getSubscribersOnlyLabel()}
                    featuresIntro={c('Visionary upsell').t`Everything in ${unlimitedName}, plus:`}
                    features={visionaryFeatures}
                    highlightLine={
                        isFull ? undefined : c('Visionary upsell').t`Includes Ultra servers, reserved for you`
                    }
                    ctaLabel={getDiscoverText(visionaryName)}
                    onCta={() => handleDiscover(PLANS.VISIONARY)}
                    data-testid="visionary-card"
                />
            </div>
            {visionaryModal.render && (
                <PlanUpgradeModal
                    {...visionaryModal.modalProps}
                    offeredPlanName={PLANS.VISIONARY}
                    subscriberPlan={subscriberPlan}
                    subscription={subscription}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    onUpgrade={() => handleUpgrade(PLANS.VISIONARY)}
                    onComparePlans={() => handleComparePlans(PLANS.VISIONARY)}
                />
            )}
            {unlimitedModal.render && (
                <PlanUpgradeModal
                    {...unlimitedModal.modalProps}
                    offeredPlanName={PLANS.BUNDLE}
                    subscriberPlan={subscriberPlan}
                    subscription={subscription}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    onUpgrade={() => handleUpgrade(PLANS.BUNDLE)}
                    onComparePlans={() => handleComparePlans(PLANS.BUNDLE)}
                />
            )}
        </DashboardGrid>
    );
};

export default VisionaryUpsellCards;
