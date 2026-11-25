import { Fragment, type ReactNode } from 'react';

import { useConfig } from '@proton/app-context/useConfig';
import { DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { APPS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    NEWSLETTER_SUBSCRIPTIONS_BY_BITS,
    type NewsletterSubscriptionUpdateData,
    getSubscriptionPatchUpdate,
} from '@proton/shared/lib/helpers/newsletter';

import InputFieldStacked from '../../components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '../../components/inputFieldStacked/InputFieldStackedGroup';
import Info from '../../components/link/Info';
import Logo from '../../components/logo/Logo';
import Toggle from '../../components/toggle/Toggle';
import { SettingsIconRow } from './SettingsIconRow';
import { SettingsValueRow } from './SettingsValueRow';
import type { EmailSubscription } from './constants/email-subscriptions';

interface EmailSubscriptionToggleProps {
    loadingMap: { [key: string]: boolean };
    News: number;
    onChange: (data: NewsletterSubscriptionUpdateData) => void;
}

interface EmailSubscriptionCheckboxesProps extends EmailSubscriptionToggleProps {
    subscriptions: EmailSubscription[];
}

const EmailSubscriptionToggle = ({
    subscription: { id, flag },
    loadingMap,
    News,
    onChange,
}: EmailSubscriptionToggleProps & { subscription: EmailSubscription }) => {
    const checked = hasBit(News, flag);
    const key = NEWSLETTER_SUBSCRIPTIONS_BY_BITS[flag];

    return (
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
    );
};

const EmailSubscriptionToggles = ({ subscriptions, ...rest }: EmailSubscriptionCheckboxesProps) => {
    return (
        <ul className="unstyled relative my-0 flex flex-column gap-2">
            {subscriptions.map((subscription) => {
                const { id, title, frequency, tooltip } = subscription;

                return (
                    <li key={id} className="flex items-center flex-nowrap gap-4">
                        <EmailSubscriptionToggle subscription={subscription} {...rest} />
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

const LiteAppEmailSubscriptionToggles = ({ subscriptions, ...rest }: EmailSubscriptionCheckboxesProps) => {
    return (
        <InputFieldStackedGroup>
            {subscriptions.map((subscription) => {
                const { id, title, frequency, tooltip } = subscription;

                return (
                    <InputFieldStacked isGroupElement key={id}>
                        <div className="flex items-center justify-space-between flex-nowrap">
                            <label htmlFor={id} className="flex flex-column gap-1">
                                <div className="flex items-center gap-1 text-semibold">{title}</div>
                                {frequency && <span className="text-sm color-weak">{frequency}</span>}
                                {tooltip && <span className="text-sm color-weak">{tooltip}</span>}
                            </label>
                            <EmailSubscriptionToggle subscription={subscription} {...rest} />
                        </div>
                    </InputFieldStacked>
                );
            })}
        </InputFieldStackedGroup>
    );
};

interface EmailSubscriptionCardTogglesProps extends EmailSubscriptionCheckboxesProps {
    /** `stacked` shows the frequency as a description under the title instead of in its own column */
    layout?: 'inline' | 'stacked';
}

export const EmailSubscriptionCardToggles = ({
    subscriptions,
    layout = 'inline',
    ...rest
}: EmailSubscriptionCardTogglesProps) => {
    if (!subscriptions.length) {
        return null;
    }

    return subscriptions.map((subscription, index) => {
        const { id, title, frequency, tooltip, appName } = subscription;

        const row = (
            <SettingsValueRow
                label={
                    <>
                        <SettingsValueRow.Label>
                            <label htmlFor={id}>{title}</label>
                            {tooltip && <Info title={tooltip} />}
                        </SettingsValueRow.Label>
                        {layout === 'stacked' && frequency && (
                            <SettingsValueRow.Description>{frequency}</SettingsValueRow.Description>
                        )}
                    </>
                }
                value={layout === 'inline' ? frequency : undefined}
                truncateValue={false}
                action={<EmailSubscriptionToggle subscription={subscription} {...rest} />}
            />
        );

        return (
            <Fragment key={id}>
                {index > 0 && <DashboardCardDivider />}
                {appName ? (
                    <SettingsIconRow icon={<Logo appName={appName} variant="glyph-only" size={6} />}>
                        {row}
                    </SettingsIconRow>
                ) : (
                    row
                )}
            </Fragment>
        );
    });
};

interface Props extends EmailSubscriptionCheckboxesProps {
    /** Leave out when the page heading already names the group */
    title?: ReactNode;
}

export const EmailSubscriptionToggleWithHeader = ({ subscriptions, title, ...rest }: Props) => {
    const { APP_NAME } = useConfig();

    if (!subscriptions.length) {
        return null;
    }

    return (
        <div>
            {title && <div className="text-semibold text-lg mb-2">{title}</div>}
            {APP_NAME === APPS.PROTONACCOUNTLITE ? (
                <LiteAppEmailSubscriptionToggles subscriptions={subscriptions} {...rest} />
            ) : (
                <EmailSubscriptionToggles subscriptions={subscriptions} {...rest} />
            )}
        </div>
    );
};
