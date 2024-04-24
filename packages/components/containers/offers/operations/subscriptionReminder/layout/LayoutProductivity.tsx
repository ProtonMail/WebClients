import { c } from 'ttag';

import at from '@proton/styles/assets/img/subscription-reminder/at.svg';
import desktop from '@proton/styles/assets/img/subscription-reminder/desktop.svg';
import starShining from '@proton/styles/assets/img/subscription-reminder/star-shining.svg';
import storage from '@proton/styles/assets/img/subscription-reminder/storage.svg';

import ReminderCTA from './ReminderCTA';
import ReminderDeal, { DealItem } from './ReminderDeal';
import ReminderHeader from './ReminderHeader';

interface Props {
    onClick: () => void;
    onClose: () => void;
}

const LayoutProductivity = ({ onClick, onClose }: Props) => {
    // translator: The full sentence is: 'Automatic email forwarding and 15 more premium features'
    const strongText = (
        <strong key="premium-features">{c('subscription reminder').t`and 15 more premium features`}</strong>
    );

    const productivityDeals: DealItem[] = [
        { icon: storage, text: c('subscription reminder').t`15 GB storage` },
        { icon: desktop, text: c('subscription reminder').t`Desktop app` },
        { icon: at, text: c('subscription reminder').t`Short @pm.me email address` },
        // translator: The full sentence is: 'Automatic email forwarding and 15 more premium features'
        { icon: starShining, text: c('subscription reminder').jt`Automatic email forwarding ${strongText}` },
    ];

    return (
        <section>
            <ReminderHeader title={c('subscription reminder').t`Upgrade your productivity`} onClose={onClose} />
            <ReminderDeal items={productivityDeals} />
            <ReminderCTA ctaText={c('subscription reminder').t`Upgrade`} onClick={onClick} />
        </section>
    );
};

export default LayoutProductivity;
