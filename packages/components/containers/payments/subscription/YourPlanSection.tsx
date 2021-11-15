import { c, msgid } from 'ttag';
import { APPS, PLAN_NAMES, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import percentage from '@proton/shared/lib/helpers/percentage';
import { getHasB2BPlan, getHasLegacyPlans, isTrial } from '@proton/shared/lib/helpers/subscription';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { Audience } from '@proton/shared/lib/interfaces';

import { Button, Href, Icon, Loader, Meter } from '../../../components';
import { useAddresses, useOrganization, useSubscription, useUser } from '../../../hooks';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
import { formatPlans } from './helpers';
import { SettingsSection } from '../../account';
import UpsellMailSubscription from './UpsellMailSubscription';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import { SUBSCRIPTION_STEPS } from './constants';
import UpsellVPNSubscription from './UpsellVPNSubscription';
import UpsellSubscription from './UpsellSubscription';
import YourReferralPlanSection from './YourReferralPlanSection';
import { useSubscriptionModal } from './SubscriptionModalProvider';

const getVpnConnectionsText = (n = 0) => {
    return c('Label').ngettext(msgid`${n} VPN connection available`, `${n} VPN connections available`, n);
};

const mailAppName = getAppName(APPS.PROTONMAIL);
const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);

const YourPlanSection = () => {
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [open] = useSubscriptionModal();
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    if (loadingSubscription || loadingOrganization || loadingAddresses) {
        return <Loader />;
    }

    const { Plans = [], isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const { hasPaidMail, hasPaidVpn, isFree } = user;

    /*
     * Feature data in general (used space, user addresses, etc.) is found
     * on the organization of a user.
     *
     * However, only paid users have organizations, therefore we have to pick
     * some smart defaults for when those values are missing.
     *
     * For space, that information is found on the user directly (also on
     * the organization if the user has a paid plan)
     */
    const {
        UsedDomains = 0,
        MaxDomains = 1,
        MaxCalendars = 1,
        UsedCalendars = 0,
        UsedSpace = user.UsedSpace,
        MaxSpace = user.MaxSpace,
        UsedAddresses: OrganizationUsedAddresses,
        MaxAddresses: OrganizationMaxAddresses,
        UsedMembers = 1,
        MaxMembers = 1,
        MaxVPN = 1,
    } = organization || {};

    /*
     * For addresses in particular we default to "1" for any falsy values
     * even "0" (destructuring default assignment would only pick up on the
     * destructured value being undefined).
     *
     * We do this because of the following use-case:
     * User has paid vpn subscription (and therefore has an organization set up).
     * User does not have paid mail subscription (and therefore has no bonus addresses).
     * In the scenario described above, the data on the organization claims that the
     * user actually has "0" used and/or max addresses, which might be right as part
     * of the organization but is wrong for the user itself, the user always has at
     * the very least "1" max address.
     */
    const UsedAddresses = hasAddresses ? OrganizationUsedAddresses || 1 : 0;
    const MaxAddresses = OrganizationMaxAddresses || 1;

    const { mailPlan, vpnPlan } = formatPlans(Plans);
    const { Name: mailPlanName } = mailPlan || {};
    const { Name: vpnPlanName } = vpnPlan || {};

    const humanUsedSpace = humanSize(UsedSpace);
    const humanMaxSpace = humanSize(MaxSpace);

    const formattedMailPlanName = PLAN_NAMES[mailPlanName as keyof typeof PLAN_NAMES];
    const formattedVPNPlanName = PLAN_NAMES[vpnPlanName as keyof typeof PLAN_NAMES];

    // visionary, while considered a mail plan, is a special case because it contains mail and vpn services
    const VPNPlanName = mailPlanName === PLANS.VISIONARY ? formattedMailPlanName : formattedVPNPlanName;
    const planType = hasPaidVpn ? VPNPlanName : c('Plan').t`Free`;

    // To deal with the period where accounts are being migrated
    if (getHasLegacyPlans(subscription)) {
        return (
            <SettingsSection>
                <div className="border mb2">
                    <SettingsLayout className="pb1 pt1 pl2 pr2">
                        <SettingsLayoutLeft className="text-semibold">
                            {hasPaidMail ? (
                                `${mailAppName} ${formattedMailPlanName}`
                            ) : hasAddresses ? (
                                c('Plan').t`${mailAppName} Free`
                            ) : (
                                <Href url="https://mail.protonmail.com/login">{c('Action').t`Activate`}</Href>
                            )}
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="flex-item-fluid">
                            <div className="w100 pt0-5">
                                {c('Label').ngettext(
                                    msgid`${UsedMembers} of ${MaxMembers} user`,
                                    `${UsedMembers} of ${MaxMembers} users`,
                                    MaxMembers
                                )}
                            </div>
                            <div className="mt1">
                                {c('Label').ngettext(
                                    msgid`${UsedAddresses} of ${MaxAddresses} email address`,
                                    `${UsedAddresses} of ${MaxAddresses} email addresses`,
                                    MaxAddresses
                                )}
                            </div>
                            {Boolean(hasPaidMail) && (
                                <div className="mt1">
                                    {c('Label').ngettext(
                                        msgid`${UsedDomains} of ${MaxDomains} custom domain`,
                                        `${UsedDomains} of ${MaxDomains} custom domains`,
                                        MaxDomains
                                    )}
                                </div>
                            )}
                            <div className="mt1">
                                <span id="usedSpaceLabel">{c('Label')
                                    .t`Using ${humanUsedSpace} of ${humanMaxSpace}`}</span>
                                <Meter
                                    className="mt1"
                                    aria-labelledby="usedSpaceLabel"
                                    value={Math.ceil(percentage(MaxSpace, UsedSpace))}
                                />
                            </div>
                            {hasAddresses && (
                                <UpsellMailSubscription
                                    subscription={subscription}
                                    user={user}
                                    onUpgrade={(plan: PLANS) => {
                                        open({ plan, step: SUBSCRIPTION_STEPS.CUSTOMIZATION });
                                    }}
                                />
                            )}
                        </SettingsLayoutRight>
                    </SettingsLayout>

                    <SettingsLayout className="pb1 pt1 pl2 pr2 border-top">
                        <SettingsLayoutLeft className="text-semibold">{`${vpnAppName} ${planType}`}</SettingsLayoutLeft>
                        <SettingsLayoutRight className="flex-item-fluid pt0-5">
                            {getVpnConnectionsText(hasPaidVpn ? MaxVPN : 1)}
                            <UpsellVPNSubscription
                                subscription={subscription}
                                user={user}
                                onUpgrade={() => {
                                    open({ plan: PLANS.VPNPLUS, step: SUBSCRIPTION_STEPS.CUSTOMIZATION });
                                }}
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </div>

                <Button
                    shape="outline"
                    onClick={() => {
                        open({ step: isFree ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CUSTOMIZATION });
                    }}
                >
                    {c('Action').t`Customize subscription`}
                </Button>
            </SettingsSection>
        );
    }

    const isReferralTrial = isTrial(subscription);

    const mailAddons = (
        <>
            <div className="w100 pt0-5">
                {c('Label').ngettext(
                    msgid`${UsedMembers} of ${MaxMembers} user`,
                    `${UsedMembers} of ${MaxMembers} users`,
                    MaxMembers
                )}
            </div>
            <div className="mt1">
                {c('Label').ngettext(
                    msgid`${UsedAddresses} of ${MaxAddresses} email address`,
                    `${UsedAddresses} of ${MaxAddresses} email addresses`,
                    MaxAddresses
                )}
            </div>
            {Boolean(hasPaidMail) && (
                <div className="mt1">
                    {c('Label').ngettext(
                        msgid`${UsedDomains} of ${MaxDomains} custom domain`,
                        `${UsedDomains} of ${MaxDomains} custom domains`,
                        MaxDomains
                    )}
                </div>
            )}
            <div className="mt1">
                <span id="usedSpaceLabel">{c('Label').t`Using ${humanUsedSpace} of ${humanMaxSpace}`}</span>
                <Meter
                    className="mt1"
                    aria-labelledby="usedSpaceLabel"
                    value={Math.ceil(percentage(MaxSpace, UsedSpace))}
                />
            </div>
        </>
    );

    return (
        <>
            {isReferralTrial && (
                <div className="mb1 max-w69e">
                    <YourReferralPlanSection
                        expirationDate={subscription.PeriodEnd}
                        mailAddons={mailAddons}
                        onUpgrade={(plan, step) => {
                            open({ plan, step });
                        }}
                    />
                </div>
            )}
            <SettingsSection>
                <div className="border mb2">
                    <SettingsLayout className="pb1 pt1 pl2 pr2">
                        <SettingsLayoutLeft className="text-semibold">
                            {hasPaidMail ? (
                                `${mailAppName} ${formattedMailPlanName}`
                            ) : hasAddresses ? (
                                c('Plan').t`${mailAppName} Free`
                            ) : (
                                <Href url="https://mail.protonmail.com/login">{c('Action').t`Activate`}</Href>
                            )}
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="flex-item-fluid">
                            <div className="w100 pt0-5">
                                {c('Label').ngettext(
                                    msgid`${UsedMembers} of ${MaxMembers} user`,
                                    `${UsedMembers} of ${MaxMembers} users`,
                                    MaxMembers
                                )}
                            </div>
                            <div className="mt1">
                                {c('Label').ngettext(
                                    msgid`${UsedAddresses} of ${MaxAddresses} email address`,
                                    `${UsedAddresses} of ${MaxAddresses} email addresses`,
                                    MaxAddresses
                                )}
                            </div>
                            <div className="mt1">
                                {c('Label').ngettext(
                                    msgid`${UsedCalendars} of ${MaxCalendars} calendar`,
                                    `${UsedCalendars} of ${MaxCalendars} calendars`,
                                    MaxAddresses
                                )}
                            </div>
                            {Boolean(hasPaidMail) && (
                                <div className="mt1">
                                    {c('Label').ngettext(
                                        msgid`${UsedDomains} of ${MaxDomains} custom email domain`,
                                        `${UsedDomains} of ${MaxDomains} custom email domains`,
                                        MaxDomains
                                    )}
                                </div>
                            )}
                            <div className="mt1">{getVpnConnectionsText(hasPaidVpn ? MaxVPN : 1)}</div>
                            <div className="mt1">
                                <span id="usedSpaceLabel">{c('Label')
                                    .t`Using ${humanUsedSpace} of ${humanMaxSpace}`}</span>
                                <Meter
                                    className="mt1"
                                    aria-labelledby="usedSpaceLabel"
                                    value={Math.ceil(percentage(MaxSpace, UsedSpace))}
                                />
                            </div>
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </div>

                {!isFree && (
                    <>
                        <div>
                            <Button
                                shape="ghost"
                                onClick={() => {
                                    open({
                                        step: SUBSCRIPTION_STEPS.CUSTOMIZATION,
                                    });
                                }}
                                color="norm"
                                className="mt0-25 flex flex-align-items-center flex-justify-center"
                            >
                                {c('Action').t`Edit billing cycle/payment details`}
                                <Icon name="arrow-right" className="ml0-5" />
                            </Button>
                        </div>
                        <UpsellSubscription />
                        <div>
                            <Button
                                shape="ghost"
                                onClick={() => {
                                    open({
                                        step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                                    });
                                }}
                                color="norm"
                                className="mt0-25 flex flex-align-items-center flex-justify-center"
                            >
                                {c('Action').t`Explore other Proton plans`}
                                <Icon name="arrow-right" className="ml0-5" />
                            </Button>
                        </div>
                        {!getHasB2BPlan(subscription) && (
                            <div>
                                <Button
                                    shape="ghost"
                                    onClick={() => {
                                        open({
                                            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                                            defaultAudience: Audience.B2B,
                                        });
                                    }}
                                    color="norm"
                                    className="mt0-25 flex flex-align-items-center flex-justify-center"
                                >
                                    {c('Action').t`Explore Proton plans for business`}
                                    <Icon name="arrow-right" className="ml0-5" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </SettingsSection>
        </>
    );
};
export default YourPlanSection;
