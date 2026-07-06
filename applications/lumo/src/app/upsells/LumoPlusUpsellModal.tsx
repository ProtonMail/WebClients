import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import type { ModalStateProps } from '@proton/components';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getPlanByName } from '@proton/payments/core/subscription/plans-map-wrapper';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_BUSINESS_PATH } from '../constants';
import { getMarketingUrl } from '../util/marketingUrls';
import { sendSubscriptionModalInitializedEvent, sendSubscriptionModalSubscribedEvent } from '../util/telemetry';
import LumoUpsellModal, { type UpsellAudience } from './LumoUpsellModal';

interface Props {
    modalProps: ModalStateProps;
    upsellRef?: string;
}

const LumoPlusUpsellModal = ({ modalProps, upsellRef }: Props) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const [plansResult] = usePlans();
    const { plansMap, plansMapLoading, preferredCurrency } = usePreferredPlansMap(true);

    const handleSubscriptionModalSubscribed = () => {
        modalProps.onClose();
        sendSubscriptionModalSubscribedEvent(upsellRef);
    };

    const openCheckout = (plan: PLANS) => {
        modalProps.onClose();
        sendSubscriptionModalInitializedEvent(upsellRef);

        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            maximumCycle: CYCLE.YEARLY,
            plan,
            onSubscribed: () => {
                handleSubscriptionModalSubscribed();
            },
            upsellRef,
        });
    };

    const handleUpgrade = (audience: UpsellAudience) => {
        if (audience === 'business' && !plansMap[PLANS.LUMO_BUSINESS]) {
            modalProps.onClose();
            window.location.assign(getMarketingUrl(LUMO_BUSINESS_PATH));
            return;
        }

        openCheckout(audience === 'business' ? PLANS.LUMO_BUSINESS : PLANS.LUMO);
    };

    if (plansMapLoading) {
        return <Loader />;
    }

    const lumoPlan = plansMap[PLANS.LUMO];

    if (!lumoPlan) {
        return <Loader />;
    }

    const lumoBusinessPlan =
        plansMap[PLANS.LUMO_BUSINESS] ??
        (plansResult?.plans
            ? getPlanByName(plansResult.plans, PLANS.LUMO_BUSINESS, preferredCurrency, CYCLE.YEARLY, true)
            : undefined);
    const plusMonthlyAmount = (lumoPlan.Pricing[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    return (
        <LumoUpsellModal
            modalProps={modalProps}
            plusPlan={{
                planName: c('collider_2025: Plan Name').t`${LUMO_SHORT_APP_NAME} Plus`,
                currency: lumoPlan.Currency,
                monthlyAmount: plusMonthlyAmount,
                ctaText: c('collider_2025: Upsell Title').t`Get ${LUMO_SHORT_APP_NAME} Plus`,
            }}
            businessPlan={{
                planName: c('collider_2025: Plan Name').t`${LUMO_SHORT_APP_NAME} Pro`,
                currency: lumoBusinessPlan?.Currency ?? lumoPlan.Currency,
                monthlyAmount: 1199,
                ctaText: c('collider_2025: Upsell Title').t`Get ${LUMO_SHORT_APP_NAME} Pro`,
            }}
            onUpgrade={handleUpgrade}
            loading={loadingSubscriptionModal}
        />
    );
};

export default LumoPlusUpsellModal;
