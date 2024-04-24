import { c } from 'ttag';

import sealed from '@proton/styles/assets/img/subscription-reminder/sealed.svg';
import shieldBolt from '@proton/styles/assets/img/subscription-reminder/shield-bolt.svg';
import shieldDouble from '@proton/styles/assets/img/subscription-reminder/shield-double.svg';
import storage from '@proton/styles/assets/img/subscription-reminder/storage.svg';

import ReminderCTA from './ReminderCTA';
import ReminderDeal, { DealItem } from './ReminderDeal';
import ReminderHeader from './ReminderHeader';

interface Props {
    onClose: () => void;
    onClick: () => void;
}

const LayoutPrivacy = ({ onClick, onClose }: Props) => {
    // translator: The full sentence is: 'Data breach alerts and 15 more premium features'
    const strongArgument = (
        <strong key="premium-features">{c('subscription reminder').t`and 15 more premium features`}</strong>
    );

    const privacyDeals: DealItem[] = [
        { icon: shieldDouble, text: c('subscription reminder').t`No ads or tracking` },
        { icon: sealed, text: c('subscription reminder').t`We don't sell your data` },
        { icon: storage, text: c('subscription reminder').t`15 GB storage` },
        // translator: The full sentence is: 'Data breach alerts and 15 more premium features'
        { icon: shieldBolt, text: c('subscription reminder').jt`Data breach alerts ${strongArgument}` },
    ];

    return (
        <section>
            <ReminderHeader
                onClose={onClose}
                title={c('subscription reminder').t`Your privacy is our mission`}
                description={c('subscription reminder')
                    .t`Help us keep the internet safe and private for everyone. Upgrade to a paid plan.`}
            />
            <ReminderDeal items={privacyDeals} />
            <ReminderCTA ctaText={c('subscription reminder').t`Support our mission`} onClick={onClick} />
        </section>
    );
};

export default LayoutPrivacy;
