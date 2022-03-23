import { c, msgid } from 'ttag';
import { UserModel, UserSettings, Organization, Subscription, Plan } from '@proton/shared/lib/interfaces';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import { PLAN_SERVICES, APPS, PLANS, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';

import { Icon, Loader, SettingsLink } from '../../components';
import { useConfig } from '../../hooks';

interface Props {
    user: UserModel;
    userSettings: UserSettings;
    organization?: Partial<Organization>;
    subscription?: Subscription;
}

const calendarAppName = getAppName(APPS.PROTONCALENDAR);

const SummarySection = ({ user, userSettings, organization, subscription }: Props) => {
    const { APP_NAME, LOCALES = {} } = useConfig();
    const { Email, DisplayName, Name, canPay, isAdmin } = user;
    const { UsedMembers = 0, UsedDomains = 0, MaxMembers = 0, MaxDomains = 0 } = organization || {};
    const initials = getInitials(DisplayName || Name || Email || '');
    const vpnPlan = subscription ? getPlan(subscription, PLAN_SERVICES.VPN) : undefined;
    const mailPlan = subscription ? getPlan(subscription, PLAN_SERVICES.MAIL) : undefined;

    const getPlanTitle = (plan: Plan | undefined, service: string) => {
        if (!plan) {
            return `${service} Free`;
        }
        if (plan.Name === PLANS.VISIONARY) {
            // For visionary plan, Title equals "Visionary"
            return `${service} Visionary`;
        }
        if (plan.Title) {
            return plan.Title;
        }
    };

    const closestLocale = getClosestLocaleCode(userSettings?.Locale, LOCALES);
    const languageText = LOCALES[closestLocale];

    return (
        <div className="border bg-norm shadow-norm p2">
            <div className="mb2 text-center">
                <span className="user-initials rounded text-semibold p0-25 mb0-5 inline-flex bg-primary">
                    <span className="dropdown-logout-text mauto">{initials}</span>
                </span>
                <h3 className="mb0-5 lh-rg text-ellipsis" title={DisplayName || Name}>
                    {DisplayName || Name}
                </h3>
                {organization?.Name ? (
                    <p className="mt0 mb0-5 text-ellipsis" title={organization.Name}>
                        {organization.Name}
                    </p>
                ) : null}
                <p className="mt0 mb0 text-ellipsis" title={Email}>
                    {Email}
                </p>
            </div>
            {canPay ? (
                <div className="mb1">
                    <strong className="block mb0-5">{c('Title').t`Plans`}</strong>
                    {!subscription ? (
                        <Loader />
                    ) : (
                        <ul className="unstyled mt0 mb0">
                            <li className="flex flex-nowrap flex-align-items-center">
                                <Icon name="brand-proton-vpn" className="mr0-5 flex-item-noshrink" />
                                <span className="flex-item-fluid">{getPlanTitle(vpnPlan, VPN_APP_NAME)}</span>
                            </li>
                            <li className="flex flex-nowrap flex-align-items-center">
                                <Icon name="brand-proton-mail" className="mr0-5 flex-item-noshrink" />
                                <span className="flex-item-fluid">{getPlanTitle(mailPlan, MAIL_APP_NAME)}</span>
                            </li>
                        </ul>
                    )}
                </div>
            ) : null}
            {languageText ? (
                <div className="mb1">
                    <strong className="block mb0-5">{c('Title').t`Default language`}</strong>
                    <ul className="unstyled mt0 mb0">
                        <li className="flex flex-nowrap flex-align-items-center">
                            <Icon name="globe" className="mr0-5 flex-item-noshrink" />
                            <span className="flex-item-fluid">{languageText}</span>
                        </li>
                    </ul>
                </div>
            ) : null}
            {isAdmin ? (
                <div className="mb1">
                    <strong className="block mb0-5">{c('Title').t`Your organization`}</strong>
                    {!organization ? (
                        <Loader />
                    ) : (
                        <ul className="unstyled mt0 mb0">
                            <li>
                                {c('Organization attribute').ngettext(
                                    msgid`${UsedMembers}/${MaxMembers} active user`,
                                    `${UsedMembers}/${MaxMembers} active users`,
                                    MaxMembers
                                )}
                            </li>
                            <li>
                                {c('Organization attribute').ngettext(
                                    msgid`${UsedDomains}/${MaxDomains} custom domain`,
                                    `${UsedDomains}/${MaxDomains} custom domains`,
                                    MaxDomains
                                )}
                            </li>
                        </ul>
                    )}
                </div>
            ) : null}
            {APP_NAME === APPS.PROTONACCOUNT ? (
                <div className="mb1">
                    <strong className="block mb0-5">{c('Title').t`Application settings`}</strong>
                    <ul className="unstyled mt0 mb0">
                        <li className="flex flex-nowrap flex-align-items-center">
                            <Icon name="brand-proton-mail" className="mr0-5 flex-item-noshrink" />
                            <SettingsLink path="/general" app={APPS.PROTONMAIL}>
                                {c('Link').t`${MAIL_APP_NAME} settings`}
                            </SettingsLink>
                        </li>
                        <li className="flex flex-nowrap flex-align-items-center">
                            <Icon name="brand-proton-calendar" className="mr0-5 flex-item-noshrink" />
                            <SettingsLink path="/general" app={APPS.PROTONCALENDAR}>
                                {c('Link').t`${calendarAppName} settings`}
                            </SettingsLink>
                        </li>
                    </ul>
                </div>
            ) : null}
            {APP_NAME === APPS.PROTONACCOUNT ? null : (
                <div className="mb1">
                    <SettingsLink path="/dashboard">{c('Link').t`Manage account`}</SettingsLink>
                </div>
            )}
        </div>
    );
};

export default SummarySection;
