import { ReactNode } from 'react';
import { hasMailPlus } from '@proton/shared/lib/helpers/subscription';
import { PLANS } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { Button, Card } from '../../../components';

import UpsellItem from './UpsellItem';

const UpsellMailTemplate = ({ children }: { children: ReactNode }) => (
    <Card rounded border={false} className="mt1-5">
        <UpsellItem icon="people">{c('Mail upsell feature').t`Get Multi-user support`}</UpsellItem>
        <UpsellItem icon="buildings">{c('Mail upsell feature').t`Host emails for your organization`}</UpsellItem>
        <UpsellItem icon="key">{c('Mail upsell feature').t`Create separate logins for each user`}</UpsellItem>
        {children}
    </Card>
);

interface Props {
    subscription: Subscription;
    user: UserModel;
    onUpgrade: (plan: PLANS) => void;
}

const UpsellMailSubscription = ({ subscription, user, onUpgrade }: Props) => {
    const isFreeMail = !user.hasPaidMail;

    if (isFreeMail) {
        return (
            <UpsellMailTemplate>
                <Button color="norm" className="mt1" onClick={() => onUpgrade(PLANS.PLUS)}>
                    {c('Action').t`Upgrade to Plus`}
                </Button>
            </UpsellMailTemplate>
        );
    }

    if (hasMailPlus(subscription)) {
        return (
            <UpsellMailTemplate>
                <Button color="norm" className="mt1" onClick={() => onUpgrade(PLANS.PROFESSIONAL)}>
                    {c('Action').t`Upgrade to Professional`}
                </Button>
            </UpsellMailTemplate>
        );
    }

    return null;
};

export default UpsellMailSubscription;
