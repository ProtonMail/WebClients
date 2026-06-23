import type { ReactNode } from 'react';

import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import useConfig from '@proton/components/hooks/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    NEWSLETTER_SUBSCRIPTIONS_BY_BITS,
    type NewsletterSubscriptionUpdateData,
    getSubscriptionPatchUpdate,
} from '@proton/shared/lib/helpers/newsletter';

import type { EmailSubscription } from './constants/email-subscriptions';

export interface EmailSubscriptionCheckboxesProps {
    loadingMap: { [key: string]: boolean };
    News: number;
    onChange: (data: NewsletterSubscriptionUpdateData) => void;
    subscriptions: EmailSubscription[];
}

const EmailSubscriptionToggles = ({ loadingMap, News, onChange, subscriptions }: EmailSubscriptionCheckboxesProps) => {
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

const LiteAppEmailSubscriptionToggles = ({
    loadingMap,
    News,
    onChange,
    subscriptions,
}: EmailSubscriptionCheckboxesProps) => {
    return (
        <InputFieldStackedGroup>
            {subscriptions.map(({ id, flag, title, frequency, tooltip }) => {
                const checked = hasBit(News, flag);
                const key = NEWSLETTER_SUBSCRIPTIONS_BY_BITS[flag];

                return (
                    <InputFieldStacked isGroupElement key={id}>
                        <div className="flex items-center justify-space-between flex-nowrap">
                            <label htmlFor={id} className="flex flex-column gap-1">
                                <div className="flex items-center gap-1 text-semibold">{title}</div>
                                {(frequency || tooltip) && (
                                    <span className="text-sm color-weak">
                                        {frequency} {tooltip}
                                    </span>
                                )}
                            </label>
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
                        </div>
                    </InputFieldStacked>
                );
            })}
        </InputFieldStackedGroup>
    );
};

interface Props extends EmailSubscriptionCheckboxesProps {
    title: ReactNode;
}

export const EmailSubscriptionToggleWithHeader = ({ subscriptions, title, ...rest }: Props) => {
    const { APP_NAME } = useConfig();

    if (!subscriptions.length) {
        return null;
    }

    return (
        <div>
            <div className="text-semibold text-lg mb-2">{title}</div>
            {APP_NAME === APPS.PROTONACCOUNTLITE ? (
                <LiteAppEmailSubscriptionToggles subscriptions={subscriptions} {...rest} />
            ) : (
                <EmailSubscriptionToggles subscriptions={subscriptions} {...rest} />
            )}
        </div>
    );
};
