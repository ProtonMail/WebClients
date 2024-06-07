import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Price, SettingsLink } from '@proton/components/components';
import { useAssistantSubscriptionStatus, useOrganization, useSubscription } from '@proton/components/hooks';
import { hasOrganizationSetup } from '@proton/shared/lib/helpers/organization';

import useAssistantToggle from './useAssistantToggle';

interface Props {
    onRenewClick: () => void;
    onClick?: () => void;
}

const AssistantToggleDescription = ({ onRenewClick, onClick }: Props) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const { addonPlan, getMinimalAssistantPrice, isOrgAdmin, hasBoughtPlan, isRenewalEnabled } = useAssistantToggle();

    const price = (
        <Price key="regular-amount" currency={addonPlan?.Currency} isDisplayedInSentence>
            {getMinimalAssistantPrice()}
        </Price>
    );

    const { trialStatus, trialEndDate } = useAssistantSubscriptionStatus();
    const isFreeTrialRunning = trialStatus === 'trial-ongoing';
    if (isFreeTrialRunning && trialEndDate) {
        const formattedDate = format(trialEndDate, 'PP');
        return (
            <>
                <p className="m-0">{c('Assistant toggle').jt`from ${price} /month`}</p>
                <p className="color-weak m-0">{c('Assistant toggle').t`Trial expires on ${formattedDate}`}</p>
            </>
        );
    }

    const subscriptionRenewalDate = format(fromUnixTime(subscription?.PeriodEnd ?? 0), 'PP');
    if (hasBoughtPlan && isRenewalEnabled && !isOrgAdmin) {
        return (
            <div>
                <p className="m-0 mb-1">{c('Assistant toggle')
                    .t`Automatically renews on ${subscriptionRenewalDate}`}</p>
                <Button shape="underline" className="color-weak m-0 p-0" onClick={onClick}>{c('Assistant toggle')
                    .t`Cancel the writing assistant subscription`}</Button>
            </div>
        );
    }

    if (hasBoughtPlan && !isRenewalEnabled) {
        return (
            <div>
                <p className="m-0 mb-1 flex items-center gap-2">{c('Assistant toggle')
                    .t`Active until ${subscriptionRenewalDate}`}</p>
                <Button onClick={onRenewClick} shape="underline" color="norm" className="m-0 p-0">{c('Assistant toggle')
                    .t`Renew subscription`}</Button>
            </div>
        );
    }

    if (isOrgAdmin) {
        if (hasBoughtPlan) {
            return (
                <div>
                    <p className="m-0 mb-1">{c('Assistant toggle')
                        .t`Automatically renews on ${subscriptionRenewalDate}`}</p>
                    <Button shape="underline" className="p-0 m-0" onClick={onClick}>{c('Assistant toggle')
                        .t`Customize plan`}</Button>
                </div>
            );
        }

        const settingLings = hasOrganizationSetup(organization) ? '/users-addresses' : '/multi-user-support';
        const userAndAddressesButton = (
            <SettingsLink path={settingLings} target="_self" className="color-weak">
                {c('Link').t`Users and addresses`}
            </SettingsLink>
        );

        return (
            <div>
                <Button shape="underline" className="p-0 m-0" color="norm" onClick={onClick}>{c('Assistant toggle')
                    .t`Customize plan to add seats`}</Button>

                <p className="m-0 color-weak">{c('Assistant toggle')
                    .jt`You can enable/disable this add-on per user in ${userAndAddressesButton}`}</p>
            </div>
        );
    }

    return <p className="m-0">{c('Assistant toggle').jt`from ${price} /month`}</p>;
};

export default AssistantToggleDescription;
