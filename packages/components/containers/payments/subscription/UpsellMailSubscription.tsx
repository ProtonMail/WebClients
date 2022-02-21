import { ReactNode } from 'react';
import { hasMailPlus } from '@proton/shared/lib/helpers/subscription';
import { PLANS } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Loader, Button, Card } from '../../../components';
import { useUser, useSubscription, useAddresses } from '../../../hooks';

import UpsellItem from './UpsellItem';
import useSubscriptionModal from './useSubscriptionModal';
import { SUBSCRIPTION_STEPS } from './constants';

const UpsellMailTemplate = ({ children }: { children: ReactNode }) => (
    <Card rounded border={false} className="mt1-5">
        <UpsellItem icon="people">{c('Mail upsell feature').t`Get Multi-user support`}</UpsellItem>
        <UpsellItem icon="buildings">{c('Mail upsell feature').t`Host emails for your organization`}</UpsellItem>
        <UpsellItem icon="key">{c('Mail upsell feature').t`Create separate logins for each user`}</UpsellItem>
        {children}
    </Card>
);

const UpsellMailSubscription = () => {
    const [{ hasPaidMail }, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const isFreeMail = !hasPaidMail;
    const [addresses, loadingAddresses] = useAddresses();
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    const [showModalCallback, loadingModal] = useSubscriptionModal();

    if (loadingModal || loadingAddresses || loadingUser || loadingSubscription) {
        return <Loader />;
    }

    if (isFreeMail && hasAddresses) {
        return (
            <UpsellMailTemplate>
                <Button
                    color="norm"
                    className="mt1"
                    onClick={() => showModalCallback(PLANS.PLUS, SUBSCRIPTION_STEPS.CUSTOMIZATION)}
                >
                    {c('Action').t`Upgrade to Plus`}
                </Button>
            </UpsellMailTemplate>
        );
    }

    if (hasMailPlus(subscription) && hasAddresses) {
        return (
            <UpsellMailTemplate>
                <Button
                    color="norm"
                    className="mt1"
                    onClick={() => showModalCallback(PLANS.PROFESSIONAL, SUBSCRIPTION_STEPS.CUSTOMIZATION)}
                >
                    {c('Action').t`Upgrade to Professional`}
                </Button>
            </UpsellMailTemplate>
        );
    }

    return null;
};

export default UpsellMailSubscription;
