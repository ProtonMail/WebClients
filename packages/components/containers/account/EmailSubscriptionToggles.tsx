import type { ReactNode } from 'react';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    NEWSLETTER_SUBSCRIPTIONS_BY_BITS,
    type NewsletterSubscriptionUpdateData,
    getSubscriptionPatchUpdate,
} from '@proton/shared/lib/helpers/newsletter';

import { type EmailSubscription } from './constants/email-subscriptions';

export interface EmailSubscriptionCheckboxesProps {
    loadingMap: { [key: string]: boolean };
    News: number;
    onChange: (data: NewsletterSubscriptionUpdateData) => void;
    subscriptions: EmailSubscription[];
}

export const EmailSubscriptionToggles = ({
    loadingMap,
    News,
    onChange,
    subscriptions,
}: EmailSubscriptionCheckboxesProps) => {
    return (
        <ul className="unstyled relative my-0 flex flex-column gap-2">
            {subscriptions.map(({ id, flag, title, frequency, tooltip }) => {
                const checked = hasBit(News, flag);
                const key = NEWSLETTER_SUBSCRIPTIONS_BY_BITS[flag];

                return (
                    <li key={id} className="flex items-center flex-nowrap gap-4">
                        <Toggle
                            id={id}
                            className="shrink-0"
                            checked={checked}
                            loading={loadingMap[key]}
                            onChange={() =>
                                onChange(
                                    getSubscriptionPatchUpdate({
                                        currentNews: News,
                                        diff: { [key]: !checked },
                                    })
                                )
                            }
                        />
                        <label htmlFor={id} className="flex flex-column">
                            <div className="flex items-center gap-1">
                                <span>{title}</span>
                                {tooltip && <Info title={tooltip} />}
                            </div>
                            {frequency && <span className="text-sm color-weak">{frequency}</span>}
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

interface Props extends EmailSubscriptionCheckboxesProps {
    title: ReactNode;
}

export const EmailSubscriptionToggleWithHeader = ({ subscriptions, title, ...rest }: Props) => {
    if (!subscriptions.length) {
        return null;
    }
    return (
        <div>
            <div className="text-semibold text-lg mb-2">{title}</div>
            <EmailSubscriptionToggles subscriptions={subscriptions} {...rest} />
        </div>
    );
};
