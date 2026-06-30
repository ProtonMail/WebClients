import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import type { ModalStateProps } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS, getPlanByName } from '@proton/payments';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import LumoUpsellModal, { type UpsellAudience } from './LumoUpsellModal';
import { useLumoSubscriptionCheckout } from './useLumoSubscriptionCheckout';

interface Props {
    modalProps: ModalStateProps;
    upsellRef?: string;
}

const LumoPlusUpsellModal = ({ modalProps, upsellRef }: Props) => {
    const [plansResult] = usePlans();
    const { plansMap, plansMapLoading, preferredCurrency } = usePreferredPlansMap(true);
    const { openCheckout, openBusinessCheckout, loading: loadingSubscriptionModal } = useLumoSubscriptionCheckout({
        upsellRef,
        onSubscribed: () => {
            modalProps.onClose();
        },
    });

    const handleUpgrade = (audience: UpsellAudience) => {
        modalProps.onClose();

        if (audience === 'business') {
            openBusinessCheckout();
            return;
        }

        openCheckout(PLANS.LUMO);
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
                planName: c('collider_2025: Plan Name').t`${LUMO_SHORT_APP_NAME} AI Plus`,
                currency: lumoPlan.Currency,
                monthlyAmount: plusMonthlyAmount,
                ctaText: c('collider_2025: Upsell Title').t`Get ${LUMO_SHORT_APP_NAME} AI Plus`,
            }}
            businessPlan={{
                planName: c('collider_2025: Plan Name').t`${LUMO_SHORT_APP_NAME} AI Pro`,
                currency: lumoBusinessPlan?.Currency ?? lumoPlan.Currency,
                monthlyAmount: 1199,
                ctaText: c('collider_2025: Upsell Title').t`Get ${LUMO_SHORT_APP_NAME} AI Pro`
            }}
            onUpgrade={handleUpgrade}
            loading={loadingSubscriptionModal}
        />
    );
};

export default LumoPlusUpsellModal;
