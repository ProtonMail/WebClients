import clsx from '@proton/utils/clsx';

import { EmailSubscriptionToggleWithHeader } from './EmailSubscriptionToggles';
import { useEmailSubscriptions } from './useEmailSubscriptions';

interface Props {
    wrapperClassName?: string;
}
const EditEmailSubscription = ({ wrapperClassName }: Props) => {
    const {
        groups: { general, product, accountUpdates, notifications },
        ...sharedProps
    } = useEmailSubscriptions();

    return (
        <div className={clsx('flex flex-column', wrapperClassName)}>
            <EmailSubscriptionToggleWithHeader title={general.title} subscriptions={general.toggles} {...sharedProps} />
            <EmailSubscriptionToggleWithHeader title={product.title} subscriptions={product.toggles} {...sharedProps} />
            <EmailSubscriptionToggleWithHeader
                title={accountUpdates.title}
                subscriptions={accountUpdates.toggles}
                {...sharedProps}
            />
            <EmailSubscriptionToggleWithHeader
                title={notifications.title}
                subscriptions={notifications.toggles}
                {...sharedProps}
            />
        </div>
    );
};

export default EditEmailSubscription;
