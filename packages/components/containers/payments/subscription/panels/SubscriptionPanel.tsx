import { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    CYCLE,
    DRIVE_SHORT_APP_NAME,
    FREE_VPN_CONNECTIONS,
    MAIL_SHORT_APP_NAME,
    PLANS,
    PLAN_NAMES,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import {
    getHasPassB2BPlan,
    getHasVpnB2BPlan,
    getIsB2BAudienceFromSubscription,
    getIsCustomCycle,
    getIsPassB2BPlan,
    getPrimaryPlan,
    getVPNDedicatedIPs,
    hasMaximumCycle,
    hasPassPlus,
    hasVPN,
    hasVPNPassBundle,
    hasVpnBusiness,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import {
    Address,
    Currency,
    Organization,
    SubscriptionModel,
    UserModel,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getSpace } from '@proton/shared/lib/user/storage';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';

import { Icon, IconName, Meter, Price, StripedItem, StripedList } from '../../../../components';
import { getNCalendarsText } from '../../features/calendar';
import { PlanCardFeatureDefinition } from '../../features/interface';
import {
    FREE_PASS_ALIASES,
    FREE_VAULTS,
    FREE_VAULT_SHARING,
    PASS_PLUS_VAULTS,
    get2FAAuthenticator,
    getCustomFields,
    getDevices,
    getHideMyEmailAliases,
    getLoginsAndNotes,
    getVaultSharing,
    getVaults,
} from '../../features/pass';
import {
    getB2BFreeVPNConnectionsText,
    getB2BHighSpeedVPNConnectionsText,
    getHighSpeedVPNConnectionsText,
    getVPNConnectionsFeature,
    getVPNConnectionsText,
} from '../../features/vpn';
import { OpenSubscriptionModalCallback } from '../SubscriptionModalProvider';
import SubscriptionPanelManageUserButton from '../SubscriptionPanelManageUserButton';
import { SUBSCRIPTION_STEPS } from '../constants';
import Panel from './Panel';

interface Item extends Omit<PlanCardFeatureDefinition, 'status' | 'highlight' | 'included'> {
    status?: PlanCardFeatureDefinition['status'];
    included?: PlanCardFeatureDefinition['included'];
    actionElement?: ReactNode;
    dataTestId?: string;
}

interface SubscriptionListProps {
    items: Item[];
}

const SubscriptionItems = ({ items }: SubscriptionListProps) => {
    return (
        <>
            {items.map(
                ({
                    icon = 'checkmark',
                    text,
                    included = true,
                    status = 'available',
                    tooltip,
                    actionElement,
                    dataTestId,
                }) => {
                    if (!included) {
                        return null;
                    }

                    const key = typeof text === 'string' ? text : `${tooltip}-${icon}-${included}-${status}`;

                    return (
                        <StripedItem
                            key={key}
                            className={clsx(status === 'coming-soon' && 'color-weak')}
                            left={<Icon className={clsx(included && 'color-success')} size={5} name={icon} />}
                        >
                            <div className="flex justify-space-between items-baseline" data-testid={dataTestId}>
                                <span>{text}</span>
                                {actionElement}
                            </div>
                        </StripedItem>
                    );
                }
            )}
        </>
    );
};

const ActionButtons = ({
    user,
    subscription,
    openSubscriptionModal,
}: {
    user: UserModel;
    subscription?: SubscriptionModel;
    openSubscriptionModal: OpenSubscriptionModalCallback;
}) => {
    /**
     * Since all the components here are used in the same context, we can use the same metrics source for all of them.
     */
    const metrics = {
        source: 'plans',
    } as const;

    const hasPassB2B = getHasPassB2BPlan(subscription);

    const handleCustomizeSubscription = () => {
        const step = hasPassB2B ? SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION : SUBSCRIPTION_STEPS.CUSTOMIZATION;

        openSubscriptionModal({
            step,
            disablePlanSelection: true,
            metrics,
        });
    };
    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics,
        });
    };
    const handleEditPayment = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            metrics,
        });

    const showEditBillingDetails =
        user.isPaid && user.canPay && !hasMaximumCycle(subscription) && !hasPassB2B && !getIsCustomCycle(subscription);
    const showCustomizePlan = user.isPaid && user.canPay && getIsB2BAudienceFromSubscription(subscription);
    const showExploreOtherPlans = user.canPay;

    return (
        <>
            {
                // translator: Edit billing cycle is a button when you want to edit the billing details of your current plan, in the dashboard.
                showEditBillingDetails ? (
                    <Button
                        onClick={handleEditPayment}
                        className="mb-2"
                        size="large"
                        color="weak"
                        fullWidth
                        data-testid="edit-billing-details"
                    >{c('Action').t`Edit billing cycle`}</Button>
                ) : null
            }
            {showCustomizePlan ? (
                <Button
                    onClick={handleCustomizeSubscription}
                    className="mb-2"
                    color="weak"
                    size="large"
                    shape="outline"
                    data-testid="customize-plan"
                    fullWidth
                >{c('Action').t`Customize plan`}</Button>
            ) : null}
            {showExploreOtherPlans ? (
                <Button
                    onClick={handleExplorePlans}
                    size="large"
                    shape={user.isPaid ? 'ghost' : 'outline'}
                    color={user.isPaid ? 'norm' : 'weak'}
                    fullWidth
                    data-testid="explore-other-plan"
                >{c('Action').t`Explore other ${BRAND_NAME} plans`}</Button>
            ) : null}
        </>
    );
};

interface Props {
    app: APP_NAMES;
    user: UserModel;
    currency: Currency;
    subscription?: SubscriptionModel;
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
    const primaryPlan = getPrimaryPlan(subscription);
    const planTitle = primaryPlan?.Title || PLAN_NAMES[FREE_PLAN.Name as PLANS];
    const isPassB2bPlan = getIsPassB2BPlan(primaryPlan?.Name);

    const cycle = subscription?.Cycle ?? CYCLE.MONTHLY;
    const amount = (subscription?.Amount ?? 0) / cycle;

    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;
    const space = getSpace(user);

    const {
        UsedDomains = 0,
        MaxDomains = 0,
        UsedSpace = space.usedSpace,
        MaxSpace = space.maxSpace,
        UsedAddresses: OrganizationUsedAddresses,
        MaxAddresses: OrganizationMaxAddresses,
        UsedMembers = 1,
        MaxMembers = 1,
    } = organization || {};

    const UsedAddresses = hasAddresses ? OrganizationUsedAddresses || 1 : 0;
    const MaxAddresses = OrganizationMaxAddresses || 1;

    if (!user.canPay) {
        return null;
    }

    // Hide this panel for trial case
    if (subscription && isTrial(subscription)) {
        return null;
    }

    const storageItem = (() => {
        if (!space.splitStorage) {
            const humanUsedSpace = humanSize({ bytes: UsedSpace });
            const humanMaxSpace = humanSize({ bytes: MaxSpace });
            return (
                <StripedItem left={<Icon className="color-success" name="storage" size={5} />}>
                    <span className="block">{c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`}</span>
                    <Meter className="my-4" aria-hidden="true" value={Math.ceil(percentage(MaxSpace, UsedSpace))} />
                </StripedItem>
            );
        }

        const maxBaseSpace = humanSize({ bytes: space.maxBaseSpace, unit: 'GB', fraction: 0 });
        const maxDriveSpace = humanSize({ bytes: space.maxDriveSpace, unit: 'GB', fraction: 0 });
        const humanMaxSpace = humanSize({ bytes: space.maxBaseSpace + space.maxDriveSpace, unit: 'GB', fraction: 0 });

        return (
            <StripedItem left={<Icon className="color-success" name="storage" size={5} />}>
                <span>{humanMaxSpace}</span>
                <div className="text-sm">
                    {maxBaseSpace} {MAIL_SHORT_APP_NAME} + {maxDriveSpace} {DRIVE_SHORT_APP_NAME}
                </div>
            </StripedItem>
        );
    })();
    const alternate = user.isPaid ? undefined : 'odd';

    const getVpnAppFree = () => {
        const items: Item[] = [
            getVPNConnectionsFeature(FREE_VPN_CONNECTIONS),
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

    const getVpnPlusItems = (): Item[] => {
        const maxVpn = 10;

        return [
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
    };

    const getVpnPass = () => {
        const vpnItems = getVpnPlusItems();

        const items: Item[] = [
            ...vpnItems,
            getLoginsAndNotes(),
            getHideMyEmailAliases('unlimited'),
            get2FAAuthenticator(true),
            getVaultSharing(10),
        ];

        return (
            <StripedList alternate="odd">
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getVpnPlus = () => {
        const items = getVpnPlusItems();
        return (
            <StripedList alternate="odd">
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getPassAppFree = () => {
        const items: Item[] = [
            getLoginsAndNotes(),
            getDevices(),
            getVaults(FREE_VAULTS),
            getVaultSharing(FREE_VAULT_SHARING),
            getHideMyEmailAliases(FREE_PASS_ALIASES),
        ];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getPassAppPassPlus = () => {
        const items: Item[] = [
            getHideMyEmailAliases('unlimited'),
            getVaults(PASS_PLUS_VAULTS),
            getCustomFields(true),
            getLoginsAndNotes(),
            getDevices(),
        ];

        return (
            <StripedList>
                {storageItem}
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getVpnB2B = () => {
        const ipAddresses = getVPNDedicatedIPs(subscription);

        const getMoreButton = (
            <Button
                color="norm"
                shape="outline"
                size="small"
                className="px-2"
                data-testid="get-more-btn"
                onClick={() =>
                    openSubscriptionModal({
                        step: SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION,
                        disablePlanSelection: true,
                        metrics: {
                            /**
                             * The `vpn` in `vpn-get-more` is unimportant.
                             * The intention is to observe the user journey, not the specific plan the journey is for.
                             * However changing this would require a new metric schema version.
                             */
                            source: 'vpn-get-more',
                        },
                    })
                }
            >
                {
                    // translator: "Get more" means "Upgrade my business plan to get more user, more dedicated servers, etc"
                    c('Action').t`Get more`
                }
            </Button>
        );

        const items: Item[] = [
            {
                icon: 'users' as IconName,
                text: c('Subscription attribute').ngettext(
                    msgid`${UsedMembers} of ${MaxMembers} user`,
                    `${UsedMembers} of ${MaxMembers} users`,
                    MaxMembers
                ),
                actionElement: getMoreButton,
                dataTestId: 'users',
            },
            {
                icon: 'servers',
                text: c('Subscription attribute').ngettext(
                    msgid`${ipAddresses} dedicated server`,
                    `${ipAddresses} dedicated servers`,
                    ipAddresses
                ),
                actionElement: hasVpnBusiness(subscription) ? getMoreButton : null,
                dataTestId: 'servers',
            },
        ].filter(isTruthy) as Item[];

        return (
            <StripedList alternate="odd">
                <SubscriptionItems items={items} />
            </StripedList>
        );
    };

    const getDefault = () => {
        const items: (Item | false)[] = [
            (MaxMembers > 1 || getIsB2BAudienceFromSubscription(subscription)) && {
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
            !!MaxDomains &&
                // we need to hide the custom domains section for Pass B2B plans until SSO is implemented
                !isPassB2bPlan && {
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
                    return getNCalendarsText(user.hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE);
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
                        return getB2BFreeVPNConnectionsText(1);
                    }
                    return getVPNConnectionsText(1);
                })(),
            },
        ];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems items={items.filter(isTruthy)} />
            </StripedList>
        );
    };

    const planPriceElement = (user.hasPaidMail || user.hasPaidVpn) && (
        <Price
            className="h3 color-weak"
            currency={currency}
            suffix={subscription && amount ? c('Suffix').t`/month` : ''}
            data-testid="plan-price"
        >
            {amount}
        </Price>
    );

    const planTitleElement = (
        <h2 className="h3 m-0 pt-0 pb-1">
            <strong data-testid="plan-name">{planTitle}</strong>
        </h2>
    );

    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);

    // For the VPN B2B plan, we don't want to show the action buttons
    // The user can still open the subscription or customization flow using the other buttons, e.g. "Get more" users
    const showActionButtons = !hasVpnB2BPlan;

    return (
        <Panel
            data-testid="current-plan"
            titleDataTestId="plan-name"
            titleElement={planTitleElement}
            secondaryTitleElement={planPriceElement}
            // If there are no action buttons, we want to reduce the bottom padding of the panel
            // On the other hand, if there are action buttons, we want to keep the additional space
            // after between the last button and the border
            className={clsx(!showActionButtons && 'p-6 pb-1')}
        >
            {(() => {
                if (user.isFree && app === APPS.PROTONVPN_SETTINGS) {
                    return getVpnAppFree();
                }
                if (hasVPN(subscription)) {
                    return getVpnPlus();
                }
                if (hasVPNPassBundle(subscription)) {
                    return getVpnPass();
                }
                if (user.isFree && app === APPS.PROTONPASS) {
                    return getPassAppFree();
                }
                if (hasPassPlus(subscription)) {
                    return getPassAppPassPlus();
                }
                if (getHasVpnB2BPlan(subscription)) {
                    return getVpnB2B();
                }

                return getDefault();
            })()}
            <SubscriptionPanelManageUserButton />
            {showActionButtons ? (
                <ActionButtons user={user} subscription={subscription} openSubscriptionModal={openSubscriptionModal} />
            ) : null}
        </Panel>
    );
};

export default SubscriptionPanel;
