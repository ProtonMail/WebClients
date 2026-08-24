import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import { getPlanTitle, getRenewalTime } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { TelemetryAccountCancellationEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import type { ModalProps } from '../../../../../components/modalTwo/Modal';
import ModalTwo from '../../../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../../../components/modalTwo/ModalHeader';
import Time from '../../../../../components/time/Time';
import useApi from '../../../../../hooks/useApi';
import useDashboardPaymentFlow from '../../../../../hooks/useDashboardPaymentFlow';
import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import type { CancelSubscriptionResult } from '../types';
import stayVpnPlus from './assets/stayVpnPlus.svg';
import { features } from './feature';

interface CancelSubscriptionModalForWorldCupProps extends ModalProps {
    subscription: Subscription;
    onResolve?: (result: CancelSubscriptionResult) => void;
}

export const CancelSubscriptionModalForWorldCup = ({
    subscription,
    onResolve,
    ...rest
}: CancelSubscriptionModalForWorldCupProps) => {
    const api = useApi();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(APPS.PROTONVPN_SETTINGS);
    const planTitle = getPlanTitle(subscription) ?? '';

    const expiryDate = (
        <Time format="PPP" className="text-bold" key="expiry-time">
            {getRenewalTime(subscription)}
        </Time>
    );

    const handleCancel = () => {
        onResolve?.({ status: 'cancelled' });
    };

    const handleClose = () => {
        onResolve?.({ status: 'kept' });
    };

    const getOffer = {
        icon: stayVpnPlus,
        value: () => c('Info').t`Stay on your plan and get 50% off your next month`,
        hint: () => c('Info').t`Have some more time to decide without interruption.`,
        action: () => {
            handleClose();
            void openSubscriptionModal({
                coupon: COUPON_CODES.VPNSAVEOFFER,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                telemetryFlow,
                cycle: CYCLE.MONTHLY,
                disableCycleSelector: true,
                disablePlanSelection: true,
            });
        },
    };

    useEffect(() => {
        void sendTelemetryReport({
            api,
            delay: false,
            event: TelemetryAccountCancellationEvents.upsellModal,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            dimensions: {
                upsell_modal_action: 'upsell',
                feedbackFirstCancellationEnabled: 'false',
                coupon_code: COUPON_CODES.VPNSAVEOFFER,
                app: APPS.PROTONVPN_SETTINGS,
            },
        });
    }, []);

    return (
        <ModalTwo {...rest} onClose={handleClose} size="xlarge">
            <ModalTwoHeader title={c('Title').t`Stay for 50% off your next month`} />
            <ModalTwoContent className="flex flex-column gap-4">
                <p>
                    {c('Info')
                        .jt`If you cancel now, you will lose access to ${BRAND_NAME} ${planTitle} on ${expiryDate}, including these features:`}
                </p>

                {features.map((feature) => (
                    <div
                        key={feature.value().trim()}
                        className="vpn-features-world-cup flex flex-row items-center rounded-xl w-full gap-3"
                    >
                        {feature.icon}
                        <span className="text-semibold">{feature.value()}</span>
                    </div>
                ))}
                <div
                    className={`vpn-features-world-cup flex flex-row p-4 items-center rounded-xl w-full justify-space-between`}
                    style={{
                        backgroundColor: '#239ECE1F',
                    }}
                >
                    <div className="flex flex-row items-center gap-3 w-4/5 flex-nowrap">
                        <img src={stayVpnPlus} alt="" />
                        <div className="flex flex-column gap-1">
                            <span className="text-semibold">{getOffer.value()}</span>
                            <span className="color-weak">{getOffer.hint()}</span>
                        </div>
                    </div>
                    <Button className="w-1/5" loading={loadingSubscriptionModal} onClick={getOffer.action} color="norm">
                        {c('Button').t`Get 50% offer`}
                    </Button>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleCancel}>{c('Action').t`Cancel subscription`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
