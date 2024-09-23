import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/constants';
import { NEWSLETTER_SUBSCRIPTIONS, NEWSLETTER_SUBSCRIPTIONS_BY_BITS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isGlobalFeatureNewsEnabled } from '@proton/shared/lib/helpers/newsletter';

import type { EmailSubscription } from './constants/email-subscriptions';
import { getEmailSubscriptions } from './constants/email-subscriptions';

export type NewsletterSubscriptionUpdateData = Partial<Record<NEWSLETTER_SUBSCRIPTIONS, boolean>>;
export interface EmailSubscriptionCheckboxesProps {
    disabled: boolean;
    News: number;
    onChange: (data: NewsletterSubscriptionUpdateData) => void;
    subscriptions?: EmailSubscription[];
}

const EmailSubscriptionToggles = ({
    disabled,
    News,
    onChange,
    subscriptions = getEmailSubscriptions(),
}: EmailSubscriptionCheckboxesProps) => {
    return (
        <ul className="unstyled relative">
            {subscriptions.map(({ id, flag, title, frequency, tooltip }) => {
                const isSubscribed = hasBit(News, flag);
                const handleChange = (flag: NEWSLETTER_SUBSCRIPTIONS_BITS) => () => {
                    const update = {
                        [NEWSLETTER_SUBSCRIPTIONS_BY_BITS[flag]]: !isSubscribed,
                    };

                    onChange({
                        ...update,
                        [NEWSLETTER_SUBSCRIPTIONS.FEATURES]: isGlobalFeatureNewsEnabled(News, update),
                    });
                };

                return (
                    <li key={id} className="mb-4 flex items-center flex-nowrap gap-4">
                        <Toggle
                            id={id}
                            className="shrink-0"
                            checked={isSubscribed}
                            disabled={disabled}
                            onChange={handleChange(flag)}
                        />
                        <label htmlFor={id} className="flex flex-column md:flex-row">
                            <span className="mr-1">{title}</span>
                            {frequency && <span className="mr-1">{frequency}</span>}
                            {tooltip && (
                                <span className="text-left">
                                    <Info title={tooltip} />
                                </span>
                            )}
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

export default EmailSubscriptionToggles;
