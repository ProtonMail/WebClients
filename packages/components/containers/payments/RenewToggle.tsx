import { useState } from 'react';

import { c } from 'ttag';

import { querySubscriptionRenew } from '@proton/shared/lib/api/payments';
import { RenewState } from '@proton/shared/lib/interfaces';

import { Toggle } from '../../components';
import { useApi, useEventManager, useNotifications, useSubscription } from '../../hooks';

const getNewState = (state: RenewState): RenewState => {
    return (
        {
            [RenewState.Active]: RenewState.DisableAutopay,
            [RenewState.DisableAutopay]: RenewState.Active,
        }[state] ?? RenewState.Active
    );
};

const RenewToggle = () => {
    const [subscription] = useSubscription();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [renew, setRenew] = useState(subscription.Renew);
    const toggle = () => setRenew(getNewState);

    const [updating, setUpdating] = useState(false);

    const onChange = async () => {
        try {
            setUpdating(true);

            const Renew = getNewState(renew);
            toggle();
            await api(querySubscriptionRenew({ RenewalState: Renew }));
            await call();

            createNotification({
                text: c('Subscription renewal state').t`Subscription renewal setting was successfully updated`,
                type: 'success',
            });
        } catch {
            toggle();
        } finally {
            setUpdating(false);
        }
    };

    const toggleId = 'toggle-subscription-renew';

    return (
        <>
            <Toggle id={toggleId} checked={renew === RenewState.Active} onChange={onChange} disabled={updating} />
            <label htmlFor={toggleId} className="ml1">
                <span>{c('Subscription renewal state').t`Enable automatic subscription renew`}</span>
            </label>
        </>
    );
};

export default RenewToggle;
