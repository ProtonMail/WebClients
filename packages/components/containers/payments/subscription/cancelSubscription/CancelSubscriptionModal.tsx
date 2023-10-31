import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getPlanTitle, hasVPN, hasVPNPassBundle } from '@proton/shared/lib/helpers/subscription';
import { SubscriptionModel } from '@proton/shared/lib/interfaces';

import { ModalProps, Prompt, Time } from '../../../../components';
import { ModalTwoPromiseHandlers } from '../../../../components/modalTwo/useModalTwo';
import { CancelSubscriptionResult } from './types';

type PromiseHandlers = ModalTwoPromiseHandlers<CancelSubscriptionResult>;

export type CancelSubscriptionModalProps = ModalProps & {
    subscription: SubscriptionModel;
};

export const CancelSubscriptionModal = ({
    subscription,
    onResolve,
    onReject,
    ...rest
}: CancelSubscriptionModalProps & PromiseHandlers) => {
    const handleKeepSubscription = () => {
        onResolve({ status: 'kept' });
    };

    const handleCancelSubscription = () => {
        onResolve({ status: 'cancelled' });
    };

    const planTitle = getPlanTitle(subscription) ?? '';
    const isVpn = hasVPN(subscription) || hasVPNPassBundle(subscription);

    const latestSubscription = subscription.UpcomingSubscription ?? subscription;
    const expiryDate = (
        <Time format="PP" className="text-bold" key="expiry-time">
            {latestSubscription.PeriodEnd}
        </Time>
    );

    return (
        <Prompt
            title={c('Title').t`Cancel subscription?`}
            buttons={[
                <Button onClick={handleCancelSubscription} color="danger" data-testid="cancelSubscription">
                    {c('Action').t`Cancel subscription`}
                </Button>,
                <Button onClick={handleKeepSubscription} data-testid="keepSubscription">{c('Action')
                    .t`Keep my Plus subscription`}</Button>,
            ]}
            onClose={handleKeepSubscription}
            {...rest}
        >
            <p>{c('Info')
                .jt`If you cancel, your ${planTitle} subscription will not be renewed when it expires on ${expiryDate}.`}</p>
            {isVpn && <p>{c('Info').t`You will lose access to Plus servers and features on this date.`}</p>}
            {!isVpn && <p>{c('Info').t`You will lose access to Plus features on this date.`}</p>}
        </Prompt>
    );
};
