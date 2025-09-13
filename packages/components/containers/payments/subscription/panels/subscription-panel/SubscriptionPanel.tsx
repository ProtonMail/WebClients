import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Meter from '@proton/components/components/progress/Meter';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import Time from '@proton/components/components/time/Time';
import LearnMoreModal from '@proton/components/containers/topBanners/LearnMoreModal';
import {
    Renew,
    type Subscription,
    getHasVpnB2BPlan,
    getIsB2BAudienceFromSubscription,
    getIsPassB2BPlan,
    getIsSentinelPlan,
    getSubscriptionPlanTitle,
    hasDeprecatedVPN,
    hasDriveBusiness,
    hasLumoPlan,
    hasPass,
    hasPassFamily,
    hasVPN2024,
    hasVPNPassBundle,
    hasVisionary,
    hasVpnBusiness,
    isTrial,
} from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, DRIVE_SHORT_APP_NAME, FREE_VPN_CONNECTIONS, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Address, Organization, UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSpace } from '@proton/shared/lib/user/storage';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';

import { getBasicFeatures, getVersionHistory } from '../../../features/drive';
import { getSentinel, getSupport } from '../../../features/highlights';
import { getLumoFreeFeatures, getLumoPlusFeatures } from '../../../features/lumo';
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
    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription);
    const isPassB2bPlan = getIsPassB2BPlan(planName);
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const [learnMoreModalProps, setLearnMoreModal, renderLearnMoreModal] = useModalState();

    const space = getSpace(user);

    const {
        MaxDomains = 0,
        UsedSpace = space.usedSpace,
        MaxSpace = space.maxSpace,
        MaxMembers = 1,
        MaxAI = 0,
        MaxLumo = 0,
    } = organization || {};

    if (!user.canPay) {
        return null;
    }

    // Hide this panel for trial case, but not for B2B trials
    if (subscription && isTrial(subscription) && !isB2BTrial) {
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
        lumoText,
    } = getSubscriptionPanelText(user, organization, addresses);

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

    const getLumoFree = () => {
        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={getLumoFreeFeatures()} />
            </StripedList>
        );
    };

    const getLumoPlus = () => {
        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={getLumoPlusFeatures()} />
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
            hasVpnBusiness(subscription) && {
                icon: 'servers',
                text: serverText,
                actionElement: getMoreButtonVpnUpsell,
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
            (() => {
                if (MaxLumo <= 0 || !lumoText) {
                    return false;
                }
                const showGetMoreButton = MaxLumo !== MaxMembers;
                const actionElement = showGetMoreButton ? <GetMoreButton metricsSource="upsells" /> : null;

                return {
                    icon: 'speech-bubble',
                    text: lumoText,
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

    const planTitleElement = (
        <h2 className="h3 m-0 pt-0 pb-1">
            <strong data-testid="plan-name">{planTitle}</strong>
        </h2>
    );

    const b2bTrialLearnMore = (() => {
        const trialCancelled = subscription?.Renew === Renew.Disabled;
        if (!isB2BTrial || trialCancelled) {
            return null;
        }

        const periodEnd = subscription?.PeriodEnd;
        const startsOnTime = periodEnd ? <Time>{periodEnd}</Time> : null;

        return (
            <>
                {startsOnTime && <div className="color-weak">{c('Info').jt`Starts on ${startsOnTime}`}</div>}
                <InlineLinkButton className="color-weak" onClick={() => setLearnMoreModal(true)}>
                    {c('Link').t`Learn more`}
                </InlineLinkButton>
            </>
        );
    })();

    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);

    // In walletEA, we only show Visionary as the suggested plan, but if the user has that, there's no point in exploring other plans
    const isWalletEA = app === APPS.PROTONWALLET && hasVisionary(subscription);
    // For the VPN B2B plan, we don't want to show the action buttons
    // The user can still open the subscription or customization flow using the other buttons, e.g. "Get more" users
    const showActionButtons = !hasVpnB2BPlan && !isWalletEA;

    return (
        <>
            {renderLearnMoreModal && <LearnMoreModal {...learnMoreModalProps} />}
            <Panel
                data-testid="current-plan"
                titleDataTestId="plan-name"
                titleElement={planTitleElement}
                // If there are no action buttons, we want to reduce the bottom padding of the panel
                // On the other hand, if there are action buttons, we want to keep the additional space
                // after between the last button and the border
                className={clsx(!showActionButtons && 'p-6 pb-1')}
            >
                {b2bTrialLearnMore}
                {(() => {
                    if (user.isFree && app === APPS.PROTONVPN_SETTINGS) {
                        return getVpnAppFree();
                    }
                    if (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) {
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
                    if (hasLumoPlan(subscription)) {
                        return getLumoPlus();
                    }
                    if (user.isFree && app === APPS.PROTONLUMO) {
                        return getLumoFree();
                    }
                    if (hasDriveBusiness(subscription)) {
                        return getDriveAppB2B();
                    }

                    return getDefault();
                })()}
                <SubscriptionPanelManageUserButton />
                {showActionButtons ? <ActionButtons app={app} user={user} subscription={subscription} /> : null}
            </Panel>
        </>
    );
};

export default SubscriptionPanel;
