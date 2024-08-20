import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getPlanTitle } from '@proton/shared/lib/helpers/subscription';
import type { SubscriptionModel } from '@proton/shared/lib/interfaces';

import type { ModalProps } from '../../../../components';
import { Prompt, Time } from '../../../../components';
import type { ModalTwoPromiseHandlers } from '../../../../components/modalTwo/useModalTwo';
import type { CancelSubscriptionResult } from './types';

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
