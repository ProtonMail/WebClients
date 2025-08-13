import { useCallback, useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { type Upsell } from '@proton/components/containers/payments/subscription/helpers';
import { PaymentsContextProvider } from '@proton/payments/ui';
import {
    type APP_NAMES,
    APP_UPSELL_REF_PATH,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import noop from '@proton/utils/noop';

import { useOutgoingController } from './OutgoingController';
import { UpsellOutgoingEmergencyContactModal } from './UpsellOutgoingEmergencyContactModal';
import { useGetUpsell } from './useGetUpsell';

interface Props {
    app: APP_NAMES;
}
const BaseUpsellOutgoingEmergencyContactAction = ({ app }: Props) => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [openSubscriptionModal] = useSubscriptionModal();
    const [upsell, setUpsell] = useState<Upsell | null>(null);
    const getUpsell = useGetUpsell();

    const handle = useCallback(async () => {
        const resolvedUpsell = await getUpsell(app);
        if (!resolvedUpsell) {
            return;
        }
        setUpsell(resolvedUpsell);
        setModalOpen(true);
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'upsell') {
                handle().catch(noop);
            }
        });
    }, []);

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.ACCOUNT_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: SHARED_UPSELL_PATHS.EMERGENCY_ACCESS,
    });

    const upsellPlan = upsell?.plan;

    if (!upsellPlan) {
        return null;
    }

    return (
        <>
            {renderModal && (
                <UpsellOutgoingEmergencyContactModal
                    {...modal}
                    upsell={upsell}
                    onUpgrade={(type) => {
                        let step: SUBSCRIPTION_STEPS | undefined;
                        if (type === 'explore') {
                            step = SUBSCRIPTION_STEPS.PLAN_SELECTION;
                        } else {
                            step = SUBSCRIPTION_STEPS.CHECKOUT;
                        }
                        modal.onClose();
                        openSubscriptionModal({
                            step,
                            plan: upsellPlan,
                            cycle: upsell.cycle,
                            metrics: { source: 'upsells' },
                            upsellRef,
                        });
                    }}
                />
            )}
        </>
    );
};

export const UpsellOutgoingEmergencyContactAction = (props: Props) => {
    return (
        <PaymentsContextProvider>
            <BaseUpsellOutgoingEmergencyContactAction {...props} />
        </PaymentsContextProvider>
    );
};
