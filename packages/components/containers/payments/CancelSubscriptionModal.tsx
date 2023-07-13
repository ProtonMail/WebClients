import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { changeRenewState } from '@proton/shared/lib/api/payments';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { Renew, Subscription } from '@proton/shared/lib/interfaces';

import { ModalProps, Prompt, Time } from '../../components';
import { useApi, useEventManager } from '../../hooks';

interface Props extends ModalProps {
    subscription: Subscription;
    onConfirm?: () => void;
}

const CancelSubscriptionModal = ({ subscription, onConfirm, onClose, ...rest }: Props) => {
    const api = useApi();
    const eventManager = useEventManager();
    const [canceling, withCanceling] = useLoading();

    const onCancelSubscription = async () => {
        await api(
            changeRenewState({
                RenewalState: Renew.Disabled,
            })
        );
        await eventManager.call();
    };

    const vpnPlanName = PLAN_NAMES[PLANS.VPN];
    const vpnPlanNameShort = 'Plus';

    const expiryDate = (
        <Time format="PP" className="text-bold">
            {subscription.PeriodEnd}
        </Time>
    );

    return (
        <Prompt
            title={c('Title').t`Cancel subscription?`}
            buttons={[
                <Button
                    loading={canceling}
                    onClick={async () => {
                        await withCanceling(onCancelSubscription());
                        onConfirm?.();
                        onClose?.();
                    }}
                    color="danger"
                    data-testid="cancelSubscription"
                >
                    {c('Action').t`Cancel subscription`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Keep my ${vpnPlanNameShort} subscription`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <p>{c('Info')
                .jt`If you cancel, your ${vpnPlanName} subscription will not be renewed when it expires on ${expiryDate}.`}</p>
            <p>{c('Info').t`You will lose access to ${vpnPlanNameShort} servers and features on this date.`}</p>
        </Prompt>
    );
};

export default CancelSubscriptionModal;
