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

    const subscriptionRenewalDate = format(fromUnixTime(subscription?.PeriodEnd ?? 0), 'PP');
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
                    .t`Add writing assistant to your plan`}</Button>
                <p className="m-0 color-weak">{c('Assistant toggle')
                    .jt`Assign it to specific users in ${userAndAddressesButton}`}</p>
            </div>
        );
    }

    const AddAssistant = () => (
        <Button shape="outline" onClick={onClick}>{c('Assistant toggle').t`Add writing assistant`}</Button>
    );

    if (trialStatus === 'trial-ongoing' && trialEndDate) {
        const formattedDate = format(trialEndDate, 'PP');
        return (
            <>
                <AddAssistant />
                <p className="m-0">{c('Assistant toggle').jt`from ${price} /month`}</p>
                <p className="color-weak m-0">{c('Assistant toggle').t`Trial expires on ${formattedDate}`}</p>
            </>
        );
    }

    if (hasBoughtPlan && isRenewalEnabled) {
        return (
            <div>
                <p className="m-0 mb-1">{c('Assistant toggle')
                    .t`Automatically renews on ${subscriptionRenewalDate}`}</p>
                <Button shape="underline" className="color-weak m-0 p-0" onClick={onClick}>{c('Assistant toggle')
                    .t`Cancel writing assistant add-on`}</Button>
            </div>
        );
    }

    if (hasBoughtPlan && !isRenewalEnabled) {
        return (
            <>
                <Button shape="outline" onClick={onRenewClick}>{c('Assistant toggle').t`Renew subscription`}</Button>
                <p className="m-0 mb-1 flex items-center gap-2">{c('Assistant toggle')
                    .t`Active until ${subscriptionRenewalDate}`}</p>
            </>
        );
    }

    return (
        <>
            <Button shape="outline" onClick={onClick}>{c('Assistant toggle').t`Add writing assistant`}</Button>
            <p className="m-0">{c('Assistant toggle').jt`from ${price} /month`}</p>
        </>
    );

    return;
};

export default AssistantToggleDescription;
