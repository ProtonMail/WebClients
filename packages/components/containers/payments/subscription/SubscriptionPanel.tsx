import { c, msgid } from 'ttag';
import { PLANS, PLAN_NAMES, APPS, PLAN_SERVICES, CYCLE } from '@proton/shared/lib/constants';
import {
    getPlan,
    getPlanIDs,
    hasDrive,
    hasMail,
    hasMailPro,
    hasVPN,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import { Subscription, Organization, Address, UserModel } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import percentage from '@proton/shared/lib/helpers/percentage';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { useConfig } from '../../../hooks';
import { Price, StrippedList, StrippedItem, Meter, Button } from '../../../components';
import { OpenSubscriptionModalCallback } from '.';
import { SUBSCRIPTION_STEPS } from './constants';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    organization?: Organization;
    addresses: Address[];
    openSubscriptionModal: OpenSubscriptionModalCallback;
}

const SubscriptionPanel = ({ subscription, organization, user, addresses, openSubscriptionModal }: Props) => {
    const { APP_NAME } = useConfig();
    const isVpnApp = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const service = isVpnApp ? PLAN_SERVICES.VPN : PLAN_SERVICES.MAIL;
    const plan = subscription ? getPlan(subscription, service) : FREE_PLAN;
    const title = subscription && plan ? PLAN_NAMES[plan.Name as PLANS] : PLAN_NAMES[PLANS.FREE];
    const cycle = subscription ? subscription.Cycle : CYCLE.MONTHLY;
    const amount = subscription && plan !== undefined ? subscription.Amount / cycle : 0;
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;
    const {
        UsedDomains = 0,
        MaxDomains = 0,
        MaxCalendars = 1,
        UsedCalendars = 0,
        UsedSpace = user.UsedSpace,
        MaxSpace = user.MaxSpace,
        UsedAddresses: OrganizationUsedAddresses,
        MaxAddresses: OrganizationMaxAddresses,
        UsedMembers = 1,
        MaxMembers = 1,
        MaxVPN: OrganizationMaxVPN = 1,
    } = organization || {};
    const humanUsedSpace = humanSize(UsedSpace);
    const humanMaxSpace = humanSize(MaxSpace);
    const UsedAddresses = hasAddresses ? OrganizationUsedAddresses || 1 : 0;
    const MaxAddresses = OrganizationMaxAddresses || 1;
    const MaxVPN = user.hasPaidVpn ? OrganizationMaxVPN : 1;
    const currentPlanIDs = getPlanIDs(subscription);
    const isUpselled =
        user.isFree ||
        isTrial(subscription) ||
        hasMail(subscription) ||
        hasDrive(subscription) ||
        hasVPN(subscription) ||
        hasMailPro(subscription);

    const handleCustomizeSubscription = () =>
        openSubscriptionModal({
            planIDs: currentPlanIDs,
            cycle: subscription?.Cycle,
            currency: subscription?.Currency,
            step: SUBSCRIPTION_STEPS.CUSTOMIZATION,
            disableBackButton: true,
        });
    const handleExplorePlans = () =>
        openSubscriptionModal({
            planIDs: currentPlanIDs,
            cycle: subscription?.Cycle,
            currency: subscription?.Currency,
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
        });
    const handleEditPayment = () =>
        openSubscriptionModal({
            planIDs: currentPlanIDs,
            cycle: subscription?.Cycle,
            currency: subscription?.Currency,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disableBackButton: true,
        });

    if (!user.canPay) {
        return null;
    }

    // Hide this panel for trial case
    if (subscription && isTrial(subscription)) {
        return null;
    }

    return (
        <div className="border rounded px2 py1-5 flex-item-fluid">
            <div className="flex flex-nowrap flex-align-items-center flex-justify-space-between pt0-5">
                <h3 className="m0">
                    <strong>{title}</strong>
                </h3>
                <Price
                    className="h3 m0 color-weak"
                    currency={subscription?.Currency}
                    suffix={subscription ? c('Suffix').t`/month` : ''}
                >
                    {amount}
                </Price>
            </div>
            <StrippedList>
                {user.isFree && isVpnApp ? null : (
                    <>
                        <StrippedItem icon="check">
                            <span className="block">{c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`}</span>
                            <Meter
                                className="mt1 mb1"
                                aria-hidden="true"
                                value={Math.ceil(percentage(MaxSpace, UsedSpace))}
                            />
                        </StrippedItem>
                        <StrippedItem icon="check">
                            {c('Subscription attribute').ngettext(
                                msgid`${UsedMembers} of ${MaxMembers} user`,
                                `${UsedMembers} of ${MaxMembers} users`,
                                MaxMembers
                            )}
                        </StrippedItem>
                        <StrippedItem icon="check">
                            {c('Subscription attribute').ngettext(
                                msgid`${UsedAddresses} of ${MaxAddresses} email address`,
                                `${UsedAddresses} of ${MaxAddresses} email addresses`,
                                MaxAddresses
                            )}
                        </StrippedItem>
                        <StrippedItem icon="check">
                            {c('Subscription attribute').ngettext(
                                msgid`${UsedCalendars} of ${MaxCalendars} personal calendar`,
                                `${UsedCalendars} of ${MaxCalendars} calendars`,
                                MaxCalendars
                            )}
                        </StrippedItem>
                        {MaxDomains ? (
                            <StrippedItem icon="check">
                                {c('Subscription attribute').ngettext(
                                    msgid`${UsedDomains} of ${MaxDomains} custom domain`,
                                    `${UsedDomains} of ${MaxDomains} custom domains`,
                                    MaxDomains
                                )}
                            </StrippedItem>
                        ) : null}
                    </>
                )}
                <StrippedItem icon="check">
                    {c('Subscription attribute').ngettext(
                        msgid`${MaxVPN} VPN connection`,
                        `${MaxVPN} VPN connections`,
                        MaxVPN
                    )}
                </StrippedItem>
                {user.hasPaidVpn && !user.hasPaidMail && isVpnApp ? (
                    <StrippedItem icon="check">{c('Subscription attribute').t`Advanced VPN features`}</StrippedItem>
                ) : null}
            </StrippedList>
            {user.isPaid && user.canPay ? (
                <Button
                    onClick={handleCustomizeSubscription}
                    className="mb0-5"
                    size="large"
                    color="weak"
                    shape="outline"
                    fullWidth
                >{c('Action').t`Customize subscription`}</Button>
            ) : null}
            {user.isPaid && user.canPay ? (
                <Button
                    onClick={handleEditPayment}
                    className="mb0-5"
                    size="large"
                    color="norm"
                    shape="ghost"
                    fullWidth
                >{c('Action').t`Edit payment details`}</Button>
            ) : null}
            {(user.isFree || user.isPaid) && user.canPay && isUpselled ? (
                <Button onClick={handleExplorePlans} size="large" color="norm" shape="ghost" fullWidth>{c('Action')
                    .t`Explore all Proton plans`}</Button>
            ) : null}
        </div>
    );
};

export default SubscriptionPanel;
