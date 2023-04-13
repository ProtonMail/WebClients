import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { APPS, APP_NAMES, BRAND_NAME, CYCLE, PLANS, PLAN_NAMES, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getHasB2BPlan, getPrimaryPlan, hasPassPlus, hasVPN, isTrial } from '@proton/shared/lib/helpers/subscription';
import {
    Address,
    Currency,
    Organization,
    Subscription,
    UserModel,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import percentage from '@proton/utils/percentage';

import { Icon, Meter, Price, StripedItem, StripedList } from '../../../components';
import { PlanCardFeatureDefinition } from '../features/interface';
import {
    getCustomDomainForEmailAliases,
    getDevices,
    getForwardingMailboxes,
    getHideMyEmailAliases,
    getPasswordsAndNotes,
    getVaults,
} from '../features/pass';
import {
    getB2BHighSpeedVPNConnectionsText,
    getFreeVPNConnectionTotal,
    getHighSpeedVPNConnectionsText,
    getVPNConnectionsText,
} from '../features/vpn';
import { OpenSubscriptionModalCallback } from './SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './constants';

interface Item extends Omit<PlanCardFeatureDefinition, 'status' | 'fire' | 'included'> {
    status?: PlanCardFeatureDefinition['status'];
    included?: PlanCardFeatureDefinition['included'];
}

interface SubscriptionListProps {
    items: Item[];
}

const SubscriptionItems = ({ items }: SubscriptionListProps) => {
    return (
        <>
            {items.map(({ icon = 'checkmark', text, included = true, status = 'available', tooltip }) => {
                if (!included) {
                    return null;
                }

                const key = typeof text === 'string' ? text : `${tooltip}-${icon}-${included}-${status}`;

                return (
                    <StripedItem
                        key={key}
                        className={clsx(status === 'coming-soon' && 'color-weak')}
                        left={<Icon className={clsx(included && 'color-success')} size={20} name={icon} />}
                    >
                        {text}
                    </StripedItem>
                );
            })}
        </>
    );
};

interface Props {
    app: APP_NAMES;
    user: UserModel;
    currency: Currency;
    subscription?: Subscription;
    organization?: Organization;
    vpnServers: VPNServersCountData;
    addresses?: Address[];
    openSubscriptionModal: OpenSubscriptionModalCallback;
}

const SubscriptionPanel = ({
    app,
    currency,
    vpnServers,
    subscription,
    organization,
    user,
    addresses,
    openSubscriptionModal,
}: Props) => {
    const primaryPlan = getPrimaryPlan(subscription, app);
    const planTitle = primaryPlan?.Title || PLAN_NAMES[FREE_PLAN.Name as PLANS];

    const cycle = subscription?.Cycle ?? CYCLE.MONTHLY;
    const amount = (subscription?.Amount ?? 0) / cycle;

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
        const items: Item[] = [
            {
                icon: 'brand-proton-vpn',
                text: getVPNConnectionsText(1),
            },
            {
                icon: 'earth',
                text: getFreeServers(vpnServers.free.servers, vpnServers.free.countries),
            },
        ];

        return (
            <StripedList alternate="odd">
                <SubscriptionItems items={items} />
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
                text: getPlusServers(vpnServers.paid.servers, vpnServers.paid.countries),
            },
        ];
        return (
            <StripedList alternate="odd">
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getPassAppFree = () => {
        /**
         * To be added when pass endpoint is ready
         */
        // const getNumberOfEmailAliases = (usedAliases: number, totalAliases: number) => {
        //     return c('new_plans: feature').ngettext(
        //         msgid`${usedAliases} of ${totalAliases} Hide My Email alias`,
        //         `${usedAliases} of ${totalAliases} Hide My Email aliases`,
        //         totalAliases
        //     );
        // };

        const items: Item[] = [
            /**
             * To be added when pass endpoint is ready
             */
            // {
            //     icon: 'eye-slash',
            //     text: getNumberOfEmailAliases(usedAliases, maxAliases),
            // },
            getPasswordsAndNotes(),
            getDevices(),
        ];

        return (
            <StripedList>
                {storageItem}
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getPassAppPassPlus = () => {
        const items: Item[] = [
            getHideMyEmailAliases('unlimited'),
            {
                ...getVaults('unlimited'),
                text: c('new_plans: feature').t`Unlimited vaults`,
            },
            {
                ...getCustomDomainForEmailAliases(true),
                text: c('new_plans: feature').t`Custom domains for email aliases`,
            },

            getForwardingMailboxes('multiple'),
            getPasswordsAndNotes(),
            getDevices(),
        ];

        return (
            <StripedList>
                {storageItem}
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getDefault = () => {
        const items: Item[] = [
            ...(() => {
                if (MaxMembers > 1 || getHasB2BPlan(subscription)) {
                    return [
                        {
                            icon: 'users',
                            text: c('Subscription attribute').ngettext(
                                msgid`${UsedMembers} of ${MaxMembers} user`,
                                `${UsedMembers} of ${MaxMembers} users`,
                                MaxMembers
                            ),
                        } as const,
                    ];
                }
                return [];
            })(),
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
            ...(() => {
                if (!!MaxDomains) {
                    return [
                        {
                            icon: 'globe',
                            text: c('Subscription attribute').ngettext(
                                msgid`${UsedDomains} of ${MaxDomains} custom domain`,
                                `${UsedDomains} of ${MaxDomains} custom domains`,
                                MaxDomains
                            ),
                        } as const,
                    ];
                }
                return [];
            })(),
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
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    return (
        <div className="border rounded px2 py1-5 subscription-panel-container" data-testid="current-plan">
            <div className="flex flex-wrap flex-align-items-center flex-justify-space-between pt0-5">
                <h3 className="m-0" data-testid="plan-name">
                    <strong>{planTitle}</strong>
                </h3>
                <Price
                    className="h3 m-0 color-weak"
                    currency={currency}
                    suffix={subscription && amount ? c('Suffix').t`/month` : ''}
                    dataTestId="plan-price"
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
                if (user.isFree && app === APPS.PROTONPASS) {
                    return getPassAppFree();
                }
                if (hasPassPlus(subscription)) {
                    return getPassAppPassPlus();
                }
                return getDefault();
            })()}
            {
                // translator: Edit billing details is a button when you want to edit the billing details of your current plan, in the dashboard.
                user.isPaid && user.canPay ? (
                    <Button
                        onClick={handleEditPayment}
                        className="mb-2"
                        size="large"
                        color="weak"
                        fullWidth
                        data-testid="edit-billing-details"
                    >{c('Action').t`Edit billing details`}</Button>
                ) : null
            }
            {user.isPaid && user.canPay && getHasB2BPlan(subscription) ? (
                <Button
                    onClick={handleCustomizeSubscription}
                    className="mb-2"
                    size="large"
                    color="weak"
                    shape="outline"
                    data-testid="customize-plan"
                    fullWidth
                >{c('Action').t`Customize plan`}</Button>
            ) : null}
            {user.canPay ? (
                <Button
                    onClick={handleExplorePlans}
                    size="large"
                    color="norm"
                    shape="ghost"
                    fullWidth
                    data-testid="explore-other-plan"
                >{c('Action').t`Explore other ${BRAND_NAME} plans`}</Button>
            ) : null}
        </div>
    );
};

export default SubscriptionPanel;
