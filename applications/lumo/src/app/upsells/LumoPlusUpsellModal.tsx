import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalStateProps } from '@proton/components';
import { Price, SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { sendSubscriptionModalInitializedEvent, sendSubscriptionModalSubscribedEvent } from '../util/telemetry';
import LumoUpsellModal from './LumoUpsellModal';

interface Props {
    modalProps: ModalStateProps;
    upsellRef?: string;
    specialBackdrop?: boolean;
}

// TODO: Add the logic to refresh after subscription is completed

const LumoPlusUpsellModal = ({ modalProps, upsellRef, specialBackdrop = false }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();

    const handleSubscriptionModalSubscribed = () => {
        modalProps.onClose();
        sendSubscriptionModalSubscribedEvent(upsellRef);
    };

    const handleOpenSubscriptionModal = () => {
        console.log('debug: handling open subscription modal with UPSELL REF: ', upsellRef);
        console.log('debug: modalProps in LumoPlusUpsellModal: ', modalProps);
        modalProps.onClose();

        sendSubscriptionModalInitializedEvent(upsellRef);

        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            maximumCycle: CYCLE.YEARLY,
            plan: PLANS.LUMO,
            onSubscribed: () => {
                handleSubscriptionModalSubscribed();
            },
            metrics: {
                source: 'upsells',
            },
            upsellRef,
        });
    };

    if (plansMapLoading) {
        return <Loader />;
    }

    const lumoPlan = plansMap[PLANS.LUMO];

    if (!lumoPlan) {
        return <Loader />;
    }
    const monthlyAmount = (lumoPlan.Pricing[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const price = (
        <Price currency={lumoPlan.Currency} suffix={c('Suffix').t`/month`} key="monthlyAmount">
            {monthlyAmount}
        </Price>
    );

    return (
        <LumoUpsellModal
            modalProps={modalProps}
            upsellRef={upsellRef}
            specialBackdrop={specialBackdrop}
            // loading={plansMapLoading}
            ctaButton={
                <ButtonLike
                    onClick={handleOpenSubscriptionModal}
                    size="large"
                    color="norm"
                    shape="solid"
                    fullWidth
                    className="lumo-payment-trigger"
                >{c('collider_2025: Action').jt`Get ${LUMO_SHORT_APP_NAME} Plus from only ${price}`}</ButtonLike>
            }
        />
    );
};

export default LumoPlusUpsellModal;
