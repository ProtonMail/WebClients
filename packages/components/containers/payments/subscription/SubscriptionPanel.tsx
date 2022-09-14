import { c, msgid } from 'ttag';

import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { APPS, APP_NAMES, BRAND_NAME, CYCLE, PLANS, PLAN_NAMES, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getHasB2BPlan, getPrimaryPlan, hasVPN, isTrial } from '@proton/shared/lib/helpers/subscription';
import {
    Address,
    Currency,
    Organization,
    Subscription,
    UserModel,
    VPNCountries,
    VPNServers,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';

import { Button, Icon, IconName, Meter, Price, StripedItem, StripedList } from '../../../components';
import {
    getB2BHighSpeedVPNConnectionsText,
    getFreeVPNConnectionTotal,
    getHighSpeedVPNConnectionsText,
    getVPNConnectionsText,
} from '../features/vpn';
import { OpenSubscriptionModalCallback } from './SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './constants';

interface Item {
    icon: IconName;
    text: string;
}

interface Props {
    app: APP_NAMES;
    user: UserModel;
    currency: Currency;
    subscription?: Subscription;
    organization?: Organization;
    vpnServers?: VPNServers;
    vpnCountries?: VPNCountries;
    addresses?: Address[];
    openSubscriptionModal: OpenSubscriptionModalCallback;
}

const SubscriptionPanel = ({
    app,
    currency,
    vpnServers,
    vpnCountries,
    subscription,
    organization,
    user,
    addresses,
    openSubscriptionModal,
}: Props) => {
    const primaryPlan = getPrimaryPlan(subscription, app);
    const planTitle = primaryPlan?.Title || PLAN_NAMES[FREE_PLAN.Name as PLANS];

    const cycle = subscription?.Cycle ?? CYCLE.MONTHLY;
    const amount = (subscription?.RenewAmount ?? 0) / cycle;

    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    const {
        UsedDomains = 0,
        MaxDomains = 0,
        UsedSpace = user.UsedSpace,
        MaxSpace = user.MaxSpace,
        UsedAddresses: OrganizationUsedAddresses,
        MaxAddresses: OrganizationMaxAddresses,
        UsedMembers = 1,
        MaxMembers = 1,
    } = organization || {};

    const humanUsedSpace = humanSize(UsedSpace);
    const humanMaxSpace = humanSize(MaxSpace);
    const UsedAddresses = hasAddresses ? OrganizationUsedAddresses || 1 : 0;
    const MaxAddresses = OrganizationMaxAddresses || 1;

    const handleCustomizeSubscription = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CUSTOMIZATION,
            disablePlanSelection: true,
        });
    const handleExplorePlans = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
        });
    const handleEditPayment = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
        });

    if (!user.canPay) {
        return null;
    }

    // Hide this panel for trial case
    if (subscription && isTrial(subscription)) {
        return null;
    }

    const storageItem = (
        <StripedItem left={<Icon className="color-success" name="storage" size={20} />}>
            <span className="block">{c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`}</span>
            <Meter className="mt1 mb1" aria-hidden="true" value={Math.ceil(percentage(MaxSpace, UsedSpace))} />
        </StripedItem>
    );

    const getVpnAppFree = () => {
        return (
            <StripedList alternate="odd">
                {(
                    [
                        {
                            icon: 'brand-proton-vpn',
                            text: getVPNConnectionsText(1),
                        } as const,
                        {
                            icon: 'earth',
                            text: getFreeServers(vpnServers?.free_vpn, vpnCountries?.free_vpn.count),
                        } as const,
                    ] as Item[]
                ).map((item) => {
                    return (
                        <StripedItem
                            key={item.icon}
                            left={<Icon className="color-success" name={item.icon} size={20} />}
                        >
                            {item.text}
                        </StripedItem>
                    );
                })}
            </StripedList>
        );
    };

    const getVpnPlus = () => {
        const maxVpn = 10;
        const items: Item[] = [
            {
                icon: 'brand-proton-vpn',
                text: c('Subscription attribute').ngettext(
                    msgid`High-speed VPN on ${maxVpn} device`,
                    `High-speed VPN on ${maxVpn} devices`,
                    maxVpn
                ),
            },
            {
                icon: 'shield',
                text: c('Subscription attribute').t`Built-in ad blocker (NetShield)`,
            },
            {
                icon: 'play',
                text: c('Subscription attribute').t`Access to streaming services globally`,
            },
            {
                icon: 'earth',
                text: getPlusServers(vpnServers?.[PLANS.VPN], vpnCountries?.[PLANS.VPN].count),
            },
        ];
        return (
            <StripedList alternate="odd">
                {items.map((item) => {
                    return (
                        <StripedItem
                            key={item.icon}
                            left={<Icon className="color-success" name={item.icon} size={20} />}
                        >
                            {item.text}
                        </StripedItem>
                    );
                })}
            </StripedList>
        );
    };

    const getDefault = () => {
        const items: (Item | false)[] = [
            (MaxMembers > 1 || getHasB2BPlan(subscription)) && {
                icon: 'users',
                text: c('Subscription attribute').ngettext(
                    msgid`${UsedMembers} of ${MaxMembers} user`,
                    `${UsedMembers} of ${MaxMembers} users`,
                    MaxMembers
                ),
            },
            {
                icon: 'envelope',
                text:
                    MaxAddresses === 1 && UsedAddresses === 1
                        ? c('Subscription attribute').t`1 email address`
                        : c('Subscription attribute').ngettext(
                              msgid`${UsedAddresses} of ${MaxAddresses} email address`,
                              `${UsedAddresses} of ${MaxAddresses} email addresses`,
                              MaxAddresses
                          ),
            },
            !!MaxDomains && {
                icon: 'globe',
                text: c('Subscription attribute').ngettext(
                    msgid`${UsedDomains} of ${MaxDomains} custom domain`,
                    `${UsedDomains} of ${MaxDomains} custom domains`,
                    MaxDomains
                ),
            },
            {
                icon: 'calendar-checkmark',
                text: (() => {
                    if (MaxMembers > 1) {
                        const n = user.hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE;
                        return c('Subscription attribute').ngettext(
                            msgid`${n} calendar per user`,
                            `${n} calendars per user`,
                            n
                        );
                    }
                    const n = user.hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE;
                    return c('Subscription attribute').ngettext(msgid`${n} calendar`, `${n} calendars`, n);
                })(),
            },
            {
                icon: 'brand-proton-vpn',
                text: (() => {
                    if (user.hasPaidVpn) {
                        if (MaxMembers > 1) {
                            return getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS);
                        }
                        return getHighSpeedVPNConnectionsText(VPN_CONNECTIONS);
                    }
                    if (MaxMembers > 1) {
                        return getFreeVPNConnectionTotal();
                    }
                    return getVPNConnectionsText(1);
                })(),
            },
        ];
        return (
            <StripedList>
                {storageItem}
                {items.filter(isTruthy).map((item) => {
                    return (
                        <StripedItem
                            key={item.icon}
                            left={<Icon className="color-success" name={item.icon} size={20} />}
                        >
                            {item.text}
                        </StripedItem>
                    );
                })}
            </StripedList>
        );
    };

    return (
        <div className="border rounded px2 py1-5 subscription-panel-container">
            <div className="flex flex-nowrap flex-align-items-center flex-justify-space-between pt0-5">
                <h3 className="m0">
                    <strong>{planTitle}</strong>
                </h3>
                <Price
                    className="h3 m0 color-weak"
                    currency={currency}
                    suffix={subscription && amount ? c('Suffix').t`/month` : ''}
                >
                    {amount}
                </Price>
            </div>
            {(() => {
                if (user.isFree && app === APPS.PROTONVPN_SETTINGS) {
                    return getVpnAppFree();
                }
                if (hasVPN(subscription)) {
                    return getVpnPlus();
                }
                return getDefault();
            })()}
            {user.isPaid && user.canPay ? (
                <Button onClick={handleEditPayment} className="mb0-5" size="large" color="weak" fullWidth>{c('Action')
                    .t`Edit billing details`}</Button>
            ) : null}
            {user.isPaid && user.canPay && getHasB2BPlan(subscription) ? (
                <Button
                    onClick={handleCustomizeSubscription}
                    className="mb0-5"
                    size="large"
                    color="weak"
                    shape="outline"
                    fullWidth
                >{c('Action').t`Customize plan`}</Button>
            ) : null}
            {user.canPay ? (
                <Button onClick={handleExplorePlans} size="large" color="norm" shape="ghost" fullWidth>{c('Action')
                    .t`Explore other ${BRAND_NAME} plans`}</Button>
            ) : null}
        </div>
    );
};

export default SubscriptionPanel;
