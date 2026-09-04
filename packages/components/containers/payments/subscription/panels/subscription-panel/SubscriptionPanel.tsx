import { c } from 'ttag';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { IcBrandProtonVpn } from '@proton/icons/icons/IcBrandProtonVpn';
import { IcCalendarCheckmark } from '@proton/icons/icons/IcCalendarCheckmark';
import { IcEarth } from '@proton/icons/icons/IcEarth';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcPenSparks } from '@proton/icons/icons/IcPenSparks';
import { IcPlay } from '@proton/icons/icons/IcPlay';
import { IcServers } from '@proton/icons/icons/IcServers';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import type { EntitlementChecks } from '@proton/payments/core/entitlements/resolver';
import { hasAddonFromPlanIDs } from '@proton/payments/core/plan/addons';
import { getIsPassB2BPlan } from '@proton/payments/core/plan/helpers';
import { Renew } from '@proton/payments/core/subscription/constants';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import {
    getHasVpnB2BPlan,
    getPlanIDs,
    getSubscriptionPlanTitle,
    hasDeprecatedVPN,
    hasDriveBusiness,
    hasLumo,
    hasLumoBusiness,
    hasMeetBusiness,
    hasPass,
    hasPassFamily,
    hasVPN2024,
    hasVPNPassBundle,
    hasVPNPassProfessional,
    isTrial,
} from '@proton/payments/core/subscription/helpers';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, DRIVE_SHORT_APP_NAME, FREE_VPN_CONNECTIONS, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';
import { getSpace } from '@proton/shared/lib/user/storage';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';
import percentage from '@proton/utils/percentage';
import { VPN_SERVERS } from '@proton/vpn/constants/vpnServers';

import { Badge } from '../../../../../components/badge/Badge';
import useModalState from '../../../../../components/modalTwo/useModalState';
import Meter from '../../../../../components/progress/Meter';
import StripedItem from '../../../../../components/stripedList/StripedItem';
import { StripedList } from '../../../../../components/stripedList/StripedList';
import Time from '../../../../../components/time/Time';
import LearnMoreModal from '../../../../topBanners/LearnMoreModal';
import { getBasicFeatures, getVersionHistory } from '../../../features/drive';
import { getSentinel, getSupport } from '../../../features/highlights';
import { getLumoFreeFeatures, getLumoPlusFeatures } from '../../../features/lumo';
import { PAID_MAX_PARTICIPANTS, getMeetBusinessFeatures, getMeetFreeFeatures } from '../../../features/meet';
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
    getPasswordManager,
    getProtonPassFeature,
    getSecureVaultSharing,
    getVaultSharing,
    getVaults,
} from '../../../features/pass';
import { getNetShield, getVPNConnectionsFeature } from '../../../features/vpn';
import type { Upsell } from '../../../subscription/helpers';
import SubscriptionPanelManageUserButton from '../../SubscriptionPanelManageUserButton';
import { getSubscriptionPanelText, upsellsShowB2BUsersRow } from '../../helpers/subscriptionPanelHelpers';
import Panel from '../Panel';
import { ActionButtons } from './ActionButtons';
import { GetMoreButton } from './GetMoreButton';
import type { Item } from './Item';
import { SubscriptionItems } from './SubscriptionItems';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    subscription: MaybeFreeSubscription;
    entitlements: EntitlementChecks;
    organization?: Organization;
    addresses?: Address[];
    upsells: Upsell[];
}

const SubscriptionPanel = ({ app, subscription, organization, entitlements, user, addresses, upsells }: Props) => {
    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription);
    const isPassB2bPlan = getIsPassB2BPlan(planName);
    const trialInfo = getTrialInfoForSingleSubscription(subscription);
    const [learnMoreModalProps, setLearnMoreModal, renderLearnMoreModal] = useModalState();
    const scribeToLumo = useFlag(MailFeatureFlag.ScribeToLumo);
    const [paymentMethods, loadingPaymentMethods] = usePaymentMethods();
    const isPaymentlessB2BTrial = trialInfo.isB2BTrial && !paymentMethods?.length;

    const space = getSpace(user);

    const {
        MaxDomains = 0,
        UsedSpace = space.usedSpace,
        MaxSpace = space.maxSpace,
        MaxMembers = 1,
        MaxAI = 0,
        MaxLumo = 0,
        MaxMeet = 0,
    } = organization || {};

    if (!user.canPay) {
        return null;
    }

    // Hide this panel for the regular trial case, but not for B2B trials
    if (trialInfo.isTrial && !trialInfo.isB2BTrial) {
        return null;
    }

    const storageItem = (() => {
        if (!space.splitStorage) {
            const humanUsedSpace = humanSize({ bytes: UsedSpace });
            const humanMaxSpace = humanSize({ bytes: MaxSpace });
            return (
                <StripedItem left={<IcStorage className="color-success" size={5} />}>
                    <span className="block">{c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`}</span>
                    <Meter className="my-4" aria-hidden="true" value={Math.ceil(percentage(MaxSpace, UsedSpace))} />
                </StripedItem>
            );
        }

        const maxBaseSpace = humanSize({ bytes: space.maxBaseSpace, unit: 'GB', fraction: 0 });
        const maxDriveSpace = humanSize({ bytes: space.maxDriveSpace, unit: 'GB', fraction: 0 });
        const humanMaxSpace = humanSize({ bytes: space.maxBaseSpace + space.maxDriveSpace, unit: 'GB', fraction: 0 });

        return (
            <StripedItem left={<IcStorage className="color-success" size={5} />}>
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
                id: 'free-servers',
                icon: IcEarth,
                text: getFreeServers(VPN_SERVERS.free.servers, VPN_SERVERS.free.countries),
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
        meetText,
    } = getSubscriptionPanelText(user, organization, addresses, scribeToLumo);

    const getVpnPlusItems = (): Item[] => {
        return [
            {
                id: 'vpn-devices',
                icon: IcBrandProtonVpn,
                text: maxVPNDevicesText,
            },
            {
                id: 'net-shield',
                icon: IcShield,
                text: c('Subscription attribute').t`Built-in ad blocker (NetShield)`,
            },
            {
                id: 'streaming',
                icon: IcPlay,
                text: c('Subscription attribute').t`Access to streaming services globally`,
            },
            {
                id: 'vpn-servers',
                icon: IcEarth,
                text: getPlusServers(VPN_SERVERS.paid.servers, VPN_SERVERS.paid.countries),
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
            getLoginsAndNotes(),
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
            getLoginsAndNotes(),
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

    const b2bUsersItem: Item | false = !!userText &&
        (MaxMembers > 1 || entitlements.orgIsBusiness || upsellsShowB2BUsersRow(upsells)) && {
            id: 'users',
            icon: IcUsers,
            text: userText,
        };

    const lumoItem: Item | false = (() => {
        if (MaxLumo <= 0 || !lumoText) {
            return false;
        }
        const showGetMoreButton = MaxLumo < MaxMembers;
        const actionElement = showGetMoreButton ? <GetMoreButton /> : null;

        return {
            id: 'lumo',
            icon: IcSpeechBubble,
            text: lumoText,
            actionElement,
            isAddon: hasAddonFromPlanIDs(ADDON_PREFIXES.LUMO, getPlanIDs(subscription)),
        };
    })();

    const meetItem: Item | false = (() => {
        if (MaxMeet <= 0 || !meetText) {
            return false;
        }
        const showGetMoreButton = MaxMeet < MaxMembers;
        const actionElement = showGetMoreButton ? <GetMoreButton /> : null;

        return {
            id: 'meet',
            icon: IcMeetCamera,
            text: meetText,
            actionElement,
            isAddon: hasAddonFromPlanIDs(ADDON_PREFIXES.MEET, getPlanIDs(subscription)),
        };
    })();

    const scribeItem: Item | false = (() => {
        if (MaxAI <= 0 || !writingAssistantText) {
            return false;
        }

        const showGetMoreButton = MaxAI < MaxMembers && entitlements.orgIsBusiness;
        const actionElement = showGetMoreButton ? <GetMoreButton /> : null;

        return {
            id: 'scribe',
            icon: IcPenSparks,
            text: writingAssistantText,
            actionElement,
            isAddon: hasAddonFromPlanIDs(ADDON_PREFIXES.SCRIBE, getPlanIDs(subscription)),
        };
    })();

    const getPassAppPassFamily = () => {
        const items: (Item | false)[] = [
            b2bUsersItem,
            getPassAdminPanel(),
            getLoginsAndNotes(),
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

    const getLumoBusiness = () => {
        const items = [
            b2bUsersItem && {
                ...b2bUsersItem,
                actionElement: <GetMoreButton />,
            },
            lumoItem,
            ...getLumoPlusFeatures(),
            scribeItem,
        ];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items.filter(isTruthy)} />
            </StripedList>
        );
    };

    const getMeetFree = () => {
        return (
            <StripedList alternate={alternate}>
                <SubscriptionItems user={user} items={getMeetFreeFeatures()} />
            </StripedList>
        );
    };

    const getMeetBusiness = () => {
        return (
            <StripedList alternate={alternate}>
                <SubscriptionItems
                    user={user}
                    items={getMeetBusinessFeatures({ maxParticipants: PAID_MAX_PARTICIPANTS })}
                />
            </StripedList>
        );
    };

    const getDriveAppB2B = () => {
        const items: (Item | false)[] = [b2bUsersItem, getVersionHistory(365), getBasicFeatures()];

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items.filter(isTruthy)} />
            </StripedList>
        );
    };

    const getVpnB2B = () => {
        const getMoreButtonVpnUpsell = <GetMoreButton />;

        const items: Item[] = [
            !!b2bUsersItem && {
                ...b2bUsersItem,
                actionElement: getMoreButtonVpnUpsell,
            },
            entitlements.orgIsBusiness &&
                entitlements.orgHasVpn && {
                    id: 'servers',
                    icon: IcServers,
                    text: serverText,
                    actionElement: getMoreButtonVpnUpsell,
                    dataTestId: 'servers',
                },
        ].filter(isTruthy);

        return (
            <StripedList alternate="odd">
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getVpnPassProfessional = () => {
        const getMoreButtonVpnUpsell = <GetMoreButton />;

        const items: Item[] = [
            !!b2bUsersItem && {
                ...b2bUsersItem,
                actionElement: getMoreButtonVpnUpsell,
            },
            {
                id: 'servers',
                icon: IcServers,
                text: serverText,
                actionElement: getMoreButtonVpnUpsell,
                dataTestId: 'servers',
            },
            getNetShield(true),
            ...(user.hasPaidPass
                ? [getPasswordManager(), getHideMyEmailAliases('unlimited'), getSecureVaultSharing(true)]
                : [getProtonPassFeature(FREE_PASS_ALIASES)]),
        ].filter(isTruthy);

        return (
            <StripedList alternate={alternate}>
                {storageItem}
                <SubscriptionItems user={user} items={items} />
            </StripedList>
        );
    };

    const getDefault = () => {
        const items: (Item | false)[] = [
            b2bUsersItem,
            {
                id: 'addresses',
                icon: IcEnvelope,
                text: addressText,
            },
            !!MaxDomains &&
                !!domainsText &&
                // we need to hide the custom domains section for Pass B2B plans until SSO is implemented
                !isPassB2bPlan && {
                    id: 'domains',
                    icon: IcGlobe,
                    text: domainsText,
                },
            {
                id: 'calendars',
                icon: IcCalendarCheckmark,
                text: calendarText,
            },
            {
                id: 'vpn',
                icon: IcBrandProtonVpn,
                text: vpnText,
            },
            getProtonPassFeature(user.hasPaidPass ? 'unlimited' : FREE_PASS_ALIASES),
            entitlements.orgHasSentinel ? getSentinel(true) : false,
            scribeItem,
            lumoItem,
            meetItem,
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
            {isTrial(subscription) && <Badge type="success" className="ml-1">{c('Info').t`Free trial`}</Badge>}
        </h2>
    );

    const b2bTrialLearnMore = (() => {
        const trialCancelled = isPaidSubscription(subscription) && subscription.Renew === Renew.Disabled;
        if (!trialInfo.isB2BTrial || trialCancelled) {
            return null;
        }

        const periodEnd = subscription?.PeriodEnd;
        const startsOnTime = periodEnd ? <Time format="PPP">{periodEnd}</Time> : null;

        return (
            <>
                {startsOnTime && !isPaymentlessB2BTrial && (
                    <div className="color-weak">{c('Info').jt`Subscription starts on ${startsOnTime}`}</div>
                )}
                <InlineLinkButton className="color-weak" onClick={() => setLearnMoreModal(true)}>
                    {c('Link').t`Learn more`}
                </InlineLinkButton>
            </>
        );
    })();

    const trialEndsElement = (() => {
        if (!isTrial(subscription)) {
            return null;
        }

        const formattedPeriodEndDate = (
            <Time format="PPP" key="period-end" data-testid="period-end">
                {subscription?.PeriodEnd}
            </Time>
        );

        if (isPaymentlessB2BTrial) {
            if (loadingPaymentMethods) {
                return null;
            }

            return (
                <div className="color-weak">{c('b2b_trials_2025_Info').jt`Active until ${formattedPeriodEndDate}`}</div>
            );
        }

        return <p className="color-weak mt-1">{c('Info').jt`Trial ends on ${formattedPeriodEndDate}`}</p>;
    })();

    return (
        <>
            {renderLearnMoreModal && <LearnMoreModal {...learnMoreModalProps} />}
            <Panel data-testid="current-plan" titleDataTestId="plan-name" titleElement={planTitleElement}>
                {trialEndsElement}
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
                    if (user.isFree && (app === APPS.PROTONPASS || app === APPS.PROTONAUTHENTICATOR)) {
                        return getPassAppFree();
                    }
                    if (hasPassFamily(subscription)) {
                        return getPassAppPassFamily();
                    }
                    if (hasVPNPassProfessional(subscription)) {
                        return getVpnPassProfessional();
                    }
                    if (getHasVpnB2BPlan(subscription)) {
                        return getVpnB2B();
                    }
                    if (hasLumo(subscription)) {
                        return getLumoPlus();
                    }
                    if (hasLumoBusiness(subscription)) {
                        return getLumoBusiness();
                    }
                    if (user.isFree && app === APPS.PROTONLUMO) {
                        return getLumoFree();
                    }
                    if (hasMeetBusiness(subscription)) {
                        return getMeetBusiness();
                    }
                    if (user.isFree && app === APPS.PROTONMEET) {
                        return getMeetFree();
                    }
                    if (hasDriveBusiness(subscription)) {
                        return getDriveAppB2B();
                    }

                    return getDefault();
                })()}
                <SubscriptionPanelManageUserButton />
                <ActionButtons app={app} user={user} subscription={subscription} />
            </Panel>
        </>
    );
};

export default SubscriptionPanel;
