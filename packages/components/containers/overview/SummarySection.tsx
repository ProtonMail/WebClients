import { c, msgid } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import { APPS, CALENDAR_APP_NAME, MAIL_APP_NAME, PLAN_SERVICES, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import type {
    Organization,
    Subscription,
    SubscriptionPlan,
    UserModel,
    UserSettings,
} from '@proton/shared/lib/interfaces';

import { useConfig } from '../../hooks';

interface Props {
    user: UserModel;
    userSettings: UserSettings;
    organization?: Partial<Organization>;
    subscription?: Subscription;
}

const SummarySection = ({ user, userSettings, organization, subscription }: Props) => {
    const { APP_NAME, LOCALES = {} } = useConfig();
    const { Email, DisplayName, Name, canPay, isAdmin } = user;
    const { UsedMembers = 0, UsedDomains = 0, MaxMembers = 0, MaxDomains = 0 } = organization || {};
    const initials = getInitials(DisplayName || Name || Email || '');
    const vpnPlan = subscription ? getPlan(subscription, PLAN_SERVICES.VPN) : undefined;
    const mailPlan = subscription ? getPlan(subscription, PLAN_SERVICES.MAIL) : undefined;

    const getPlanTitle = (plan: SubscriptionPlan | undefined, service: string) => {
        if (!plan) {
            return `${service} Free`;
        }

        return plan.Title;
    };

    const closestLocale = getClosestLocaleCode(userSettings?.Locale, LOCALES);
    const languageText = LOCALES[closestLocale];

    return (
        <div className="border bg-norm shadow-norm p-6">
            <div className="mb-8 text-center">
                <span className="user-initials rounded text-semibold p-1 mb-2 inline-flex bg-primary">
                    <span className="dropdown-logout-text m-auto">{initials}</span>
                </span>
                <h3 className="mb-2 lh-rg text-ellipsis" title={DisplayName || Name}>
                    {DisplayName || Name}
                </h3>
                {organization?.Name ? (
                    <p className="mt-0 mb-2 text-ellipsis" title={organization.Name}>
                        {organization.Name}
                    </p>
                ) : null}
                <p className="my-0 text-ellipsis" title={Email}>
                    {Email}
                </p>
            </div>
            {canPay ? (
                <div className="mb-4">
                    <strong className="block mb-2">{c('Title').t`Plans`}</strong>
                    {!subscription ? (
                        <Loader />
                    ) : (
                        <ul className="unstyled my-0">
                            <li className="flex flex-nowrap items-center">
                                <Icon name="brand-proton-vpn" className="mr-2 shrink-0" />
                                <span className="flex-1">{getPlanTitle(vpnPlan, VPN_APP_NAME)}</span>
                            </li>
                            <li className="flex flex-nowrap items-center">
                                <Icon name="brand-proton-mail" className="mr-2 shrink-0" />
                                <span className="flex-1">{getPlanTitle(mailPlan, MAIL_APP_NAME)}</span>
                            </li>
                        </ul>
                    )}
                </div>
            ) : null}
            {languageText ? (
                <div className="mb-4">
                    <strong className="block mb-2">{c('Title').t`Default language`}</strong>
                    <ul className="unstyled my-0">
                        <li className="flex flex-nowrap items-center">
                            <Icon name="globe" className="mr-2 shrink-0" />
                            <span className="flex-1">{languageText}</span>
                        </li>
                    </ul>
                </div>
            ) : null}
            {isAdmin ? (
                <div className="mb-4">
                    <strong className="block mb-2">{c('Title').t`Your organization`}</strong>
                    {!organization ? (
                        <Loader />
                    ) : (
                        <ul className="unstyled my-0">
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
                <div className="mb-4">
                    <strong className="block mb-2">{c('Title').t`Application settings`}</strong>
                    <ul className="unstyled my-0">
                        <li className="flex flex-nowrap items-center">
                            <Icon name="brand-proton-mail" className="mr-2 shrink-0" />
                            <SettingsLink path="/general" app={APPS.PROTONMAIL}>
                                {c('Link').t`${MAIL_APP_NAME} settings`}
                            </SettingsLink>
                        </li>
                        <li className="flex flex-nowrap items-center">
                            <Icon name="brand-proton-calendar" className="mr-2 shrink-0" />
                            <SettingsLink path="/general" app={APPS.PROTONCALENDAR}>
                                {c('Link').t`${CALENDAR_APP_NAME} settings`}
                            </SettingsLink>
                        </li>
                    </ul>
                </div>
            ) : null}
            {APP_NAME === APPS.PROTONACCOUNT ? null : (
                <div className="mb-4">
                    <SettingsLink path="/dashboard">{c('Link').t`Manage account`}</SettingsLink>
                </div>
            )}
        </div>
    );
};

export default SummarySection;
