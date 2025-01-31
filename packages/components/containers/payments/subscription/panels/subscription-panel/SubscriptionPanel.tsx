import { c } from 'ttag';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import Price from '@proton/components/components/price/Price';
import Meter from '@proton/components/components/progress/Meter';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import { CYCLE, getSubscriptionPlanTitleAndName } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, DRIVE_SHORT_APP_NAME, FREE_VPN_CONNECTIONS, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import {
    getHasVpnB2BPlan,
    getIsB2BAudienceFromSubscription,
    getIsPassB2BPlan,
    getIsSentinelPlan,
    hasDriveBusiness,
    hasLumo,
    hasPass,
    hasPassFamily,
    hasVPN,
    hasVPNPassBundle,
    hasVisionary,
    hasVpnBusiness,
    hasWallet,
    isManagedExternally,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import type { Address, UserModel } from '@proton/shared/lib/interfaces';
import { type Organization, type Subscription, type VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSpace } from '@proton/shared/lib/user/storage';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';

import { getBasicFeatures, getVersionHistory } from '../../../features/drive';
import { getSentinel, getSupport } from '../../../features/highlights';
import {
    FREE_PASS_ALIASES,
    FREE_VAULTS,
    FREE_VAULT_SHARING,
    PASS_PLUS_VAULTS,
    PASS_PLUS_VAULT_SHARING,
    get2FAAuthenticator,
    getDarkWebMonitoring,
    getDevices,
    getHideMyEmailAliases,
    getLinkSharing,
    getLoginsAndNotes,
    getPassAdminPanel,
    getProtonPassFeature,
    getVaultSharing,
    getVaults,
} from '../../../features/pass';
import { getVPNConnectionsFeature } from '../../../features/vpn';
import {
    WALLET_PLUS_WALLETS,
    WALLET_PLUS_WALLET_ACCOUNTS,
    WALLET_PLUS_WALLET_EMAIL,
    getBitcoinViaEmail,
    getWalletAccounts,
    getWalletEmailAddresses,
    getWallets,
} from '../../../features/wallet';
import type { Upsell } from '../../../subscription/helpers';
import SubscriptionPanelManageUserButton from '../../SubscriptionPanelManageUserButton';
import { getSubscriptionPanelText } from '../../helpers/subscriptionPanelHelpers';
import Panel from '../Panel';
import { ActionButtons } from './ActionButtons';
import { GetMoreButton } from './GetMoreButton';
import type { Item } from './Item';
import { SubscriptionItems } from './SubscriptionItems';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    subscription?: Subscription;
    organization?: Organization;
    vpnServers: VPNServersCountData;
    addresses?: Address[];
    upsells: Upsell[];
}

const SubscriptionPanel = ({ app, vpnServers, subscription, organization, user, addresses, upsells }: Props) => {
    const { planTitle, planName } = getSubscriptionPlanTitleAndName(user, subscription);
    const isPassB2bPlan = getIsPassB2BPlan(planName);

    const cycle = subscription?.Cycle ?? CYCLE.MONTHLY;
    const amount = (subscription?.Amount ?? 0) / cycle;

    const space = getSpace(user);

    const {
        MaxDomains = 0,
        UsedSpace = space.usedSpace,
        MaxSpace = space.maxSpace,
        MaxMembers = 1,
        MaxAI = 0,
    } = organization || {};

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
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const {
        addressText,
        domainsText,
        userText,
        calendarText,
        vpnText,
        serverText,
        maxVPNDevicesText,
        writingAssistantText,
    } = getSubscriptionPanelText(user, organization, addresses, subscription);

    const getVpnPlusItems = (): Item[] => {
        return [
            {
                icon: 'brand-proton-vpn',
                text: maxVPNDevicesText,
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
            getLoginsAndNotes('paid'),
            getHideMyEmailAliases('unlimited'),
            get2FAAuthenticator(true),
            getVaultSharing(10),
        ];

        return (
            <StripedList alternate="odd">
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getVpnPlus = () => {
        const items = getVpnPlusItems();
        return (
            <StripedList alternate="odd">
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getPassAppFree = () => {
        const items: Item[] = [
            getLoginsAndNotes('free'),
            getDevices(),
            getVaults(FREE_VAULTS),
            getVaultSharing(FREE_VAULT_SHARING),
            getHideMyEmailAliases(FREE_PASS_ALIASES),
        ];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getPassAppPassPlus = () => {
        const items: Item[] = [
            getLoginsAndNotes('paid'),
            getDevices(),
            getHideMyEmailAliases('unlimited'),
            getVaults(PASS_PLUS_VAULTS),
            getVaultSharing(PASS_PLUS_VAULT_SHARING),
            getLinkSharing(),
            get2FAAuthenticator(true),
            getDarkWebMonitoring(),
            getSentinel(true),
            getSupport('priority'),
        ];

        return (
            <StripedList>
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getPassAppPassFamily = () => {
        const items: (Item | false)[] = [
            !!userText &&
                (MaxMembers > 1 ||
                    getIsB2BAudienceFromSubscription(subscription) ||
                    upsells.some((upsell) => upsell.features.some((feature) => feature.icon === 'users'))) && {
                    icon: 'users',
                    text: userText,
                },
            getPassAdminPanel(),
            getLoginsAndNotes('paid'),
            getDevices(),
            getHideMyEmailAliases('unlimited'),
            getVaults(PASS_PLUS_VAULTS),
            getVaultSharing(PASS_PLUS_VAULT_SHARING),
            getLinkSharing(),
            get2FAAuthenticator(true),
            getDarkWebMonitoring(),
            getSentinel(true),
            getSupport('priority'),
        ];

        return (
            <StripedList>
                <SubscriptionItems user={user} items={items.filter(isTruthy)} />
            </StripedList>
        );
    };

    const getWalletAppWalletPlus = () => {
        const items: Item[] = [
            getWallets(WALLET_PLUS_WALLETS),
            getWalletAccounts(WALLET_PLUS_WALLET_ACCOUNTS),
            getWalletEmailAddresses(WALLET_PLUS_WALLET_EMAIL),
            getBitcoinViaEmail(),
        ];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getLumo = () => {
        const items: Item[] = [];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getDriveAppB2B = () => {
        const items: (Item | false)[] = [
            !!userText &&
                (MaxMembers > 1 ||
                    getIsB2BAudienceFromSubscription(subscription) ||
                    upsells.some((upsell) => upsell.features.some((feature) => feature.icon === 'users'))) && {
                    icon: 'users',
                    text: userText,
                },
            getVersionHistory(365),
            getBasicFeatures(),
        ];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items.filter(isTruthy)} />
            </StripedList>
        );
    };

    const getVpnB2B = () => {
        /**
         * The `vpn` in `vpn-get-more` is unimportant.
         * The intention is to observe the user journey, not the specific plan the journey is for.
         * However changing this would require a new metric schema version.
         */
        const getMoreButtonVpnUpsell = <GetMoreButton metricsSource="vpn-get-more" />;

        const items: Item[] = [
            {
                icon: 'users' as IconName,
                text: userText,
                actionElement: getMoreButtonVpnUpsell,
                dataTestId: 'users',
            },
            {
                icon: 'servers',
                text: serverText,
                actionElement: hasVpnBusiness(subscription) ? getMoreButtonVpnUpsell : null,
                dataTestId: 'servers',
            },
        ].filter(isTruthy) as Item[];

        return (
            <StripedList alternate="odd">
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getDefault = () => {
        const items: (Item | false)[] = [
            !!userText &&
                (MaxMembers > 1 ||
                    getIsB2BAudienceFromSubscription(subscription) ||
                    upsells.some((upsell) => upsell.features.some((feature) => feature.icon === 'users'))) && {
                    icon: 'users',
                    text: userText,
                },
            {
                icon: 'envelope',
                text: addressText,
            },
            !!MaxDomains &&
                !!domainsText &&
                // we need to hide the custom domains section for Pass B2B plans until SSO is implemented
                !isPassB2bPlan && {
                    icon: 'globe',
                    text: domainsText,
                },
            {
                icon: 'calendar-checkmark',
                text: calendarText,
            },
            {
                icon: 'brand-proton-vpn',
                text: vpnText,
            },
            getProtonPassFeature(user.hasPaidPass ? 'unlimited' : FREE_PASS_ALIASES),
            getIsSentinelPlan(organization?.PlanName) ? getSentinel(true) : false,
            (() => {
                if (MaxAI <= 0 || !writingAssistantText) {
                    return false;
                }

                const showGetMoreButton = MaxAI !== MaxMembers && getIsB2BAudienceFromSubscription(subscription);
                const actionElement = showGetMoreButton ? <GetMoreButton metricsSource="upsells" /> : null;

                return {
                    icon: 'pen-sparks',
                    text: writingAssistantText,
                    actionElement,
                };
            })(),
        ];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items.filter(isTruthy)} />
            </StripedList>
        );
    };

    const planPriceElement = (user.hasPaidMail || user.hasPaidVpn) && !isManagedExternally(subscription) && (
        <Price
            className="h3 color-weak"
            currency={subscription?.Currency}
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

    // In walletEA, we only show Visionary as the suggested plan, but if the user has that, there's no point in exploring other plans
    const isWalletEA = app === APPS.PROTONWALLET && hasVisionary(subscription);
    // For the VPN B2B plan, we don't want to show the action buttons
    // The user can still open the subscription or customization flow using the other buttons, e.g. "Get more" users
    const showActionButtons = !hasVpnB2BPlan && !isWalletEA;

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
                if (hasPass(subscription) || (user.isFree && user.hasPassLifetime)) {
                    return getPassAppPassPlus();
                }
                if (user.isFree && app === APPS.PROTONPASS) {
                    return getPassAppFree();
                }
                if (hasPassFamily(subscription)) {
                    return getPassAppPassFamily();
                }
                if (getHasVpnB2BPlan(subscription)) {
                    return getVpnB2B();
                }
                if (hasWallet(subscription)) {
                    return getWalletAppWalletPlus();
                }
                if (hasLumo(subscription)) {
                    return getLumo();
                }
                if (hasDriveBusiness(subscription)) {
                    return getDriveAppB2B();
                }

                return getDefault();
            })()}
            <SubscriptionPanelManageUserButton />
            {showActionButtons ? <ActionButtons user={user} subscription={subscription} /> : null}
        </Panel>
    );
};

export default SubscriptionPanel;
