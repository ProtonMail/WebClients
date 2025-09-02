import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import Time from '@proton/components/components/time/Time';
import type { Subscription } from '@proton/payments';
import { getPlanTitle, getRenewalTime } from '@proton/payments';

import type { ModalTwoPromiseHandlers } from '../../../../components/modalTwo/useModalTwo';
import type { CancelSubscriptionResult } from './types';

type PromiseHandlers = ModalTwoPromiseHandlers<CancelSubscriptionResult>;

export type CancelSubscriptionModalProps = ModalProps & {
    subscription: Subscription;
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

    const expiryDate = (
        <Time format="PPP" className="text-bold" key="expiry-time">
            {getRenewalTime(subscription)}
        </Time>
    );

    return (
        <Prompt
            title={c('Title').t`Cancel subscription?`}
            buttons={[
                <Button onClick={handleCancelSubscription} color="danger" data-testid="cancelSubscription">
                    {c('Action').t`Cancel subscription`}
                </Button>,
                <Button onClick={handleKeepSubscription} data-testid="keepSubscription">
                    {c('Action').t`Keep my subscription`}
                </Button>,
            ]}
            onClose={handleKeepSubscription}
            {...rest}
        >
            <p>{c('Info')
                .jt`If you cancel, your ${planTitle} subscription will not be renewed when it expires on ${expiryDate}.`}</p>
            <p>{c('Info').t`You will lose access to ${planTitle} features on this date.`}</p>
        </Prompt>
    );
};
