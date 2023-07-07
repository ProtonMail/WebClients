import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { hasFamily } from '@proton/shared/lib/helpers/subscription';
import { Organization, Subscription, UserModel, UserType } from '@proton/shared/lib/interfaces';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    organization?: Organization;
    subscription: Subscription;
    isOrgSpamBlockListEnabled: boolean;
    isOrgTwoFactorEnabled: boolean;
}

const hiddenApps: APP_NAMES[] = [APPS.PROTONPASS];

export const getOrganizationAppRoutes = ({
    app,
    user,
    organization,
    subscription,
    isOrgSpamBlockListEnabled,
    isOrgTwoFactorEnabled,
}: Props) => {
    const isAdmin = user.isAdmin && !user.isSubUser && user.Type !== UserType.EXTERNAL;
    const canHaveOrganization = !user.isMember && !user.isSubUser && user.Type !== UserType.EXTERNAL;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);

    //Change the title of the section when managing a family and avoid weird UI jump when no subscription is present
    const isPartOfFamily = hasFamily(subscription);

    const sectionTitle = isPartOfFamily
        ? c('familyOffer_2023:Settings section title').t`Family`
        : c('Settings section title').t`Organization`;

    const subMenuTitle = isPartOfFamily
        ? c('familyOffer_2023:Title').t`Manage family group`
        : c('Title').t`Multi-user support`;

    const subSectionTitle = isPartOfFamily ? '' : c('Title').t`Multi-user support`;

    return {
        available: Boolean(isAdmin && organization && !hiddenApps.includes(app)),
        header: sectionTitle,
        routes: {
            users: <SectionConfig>{
                text: c('Title').t`Users and addresses`,
                to: '/users-addresses',
                icon: 'users',
                available: hasOrganizationKey || hasOrganization,
                subsections: [
                    {
                        id: 'members',
                    },
                    {
                        text: c('Title').t`Create multiple user accounts`,
                        id: 'multi-user-creation',
                        available: organization && !!organization.RequiresKey,
                    },
                ],
            },
            domains: <SectionConfig>{
                text: c('Title').t`Domain names`,
                to: '/domain-names',
                icon: 'globe',
                available: hasOrganizationKey,
                subsections: [
                    { id: 'domains' },
                    {
                        text: c('Title').t`Catch-all address`,
                        id: 'catch-all',
                    },
                ],
            },
            orgKeys: <SectionConfig>{
                text: subMenuTitle,
                to: '/organization-keys',
                icon: 'buildings',
                available: isPartOfFamily
                    ? hasOrganization //Show this section once the family is setup (only requires a name)
                    : (hasOrganizationKey || hasOrganization) && organization && !!organization.RequiresKey,
                subsections: [
                    {
                        text: subSectionTitle,
                        id: 'organization',
                    },
                    {
                        text: c('Title').t`Password and keys`,
                        id: 'password-keys',
                        available: hasOrganizationKey,
                    },
                ],
            },
            setup: <SectionConfig>{
                text: subMenuTitle,
                to: '/multi-user-support',
                icon: 'users',
                available: isPartOfFamily ? !hasOrganization : !hasOrganizationKey && canHaveOrganization,
                subsections: [
                    {
                        text: subSectionTitle,
                        id: 'name',
                    },
                ],
            },
            filter: <SectionConfig>{
                text: c('Title').t`Organization filters`,
                to: '/organization-filters',
                icon: 'filter',
                available: (hasOrganizationKey || hasOrganization) && isOrgSpamBlockListEnabled,
                subsections: [
                    {
                        text: c('Title').t`Spam, block, and allow lists`,
                        id: 'spam',
                    },
                ],
            },
            security: <SectionConfig>{
                text: c('Title').t`Authentication security`,
                to: '/authentication-security',
                icon: 'shield',
                available:
                    (hasOrganizationKey || hasOrganization) &&
                    organization &&
                    organization.MaxMembers > 1 &&
                    isOrgTwoFactorEnabled,
                subsections: [
                    {
                        id: 'two-factor-authentication-users',
                    },
                    {
                        text: c('Title').t`Two-factor authentication reminders`,
                        id: 'two-factor-authentication-reminders',
                    },
                    {
                        text: c('Title').t`Two-factor authentication enforcement`,
                        id: 'two-factor-authentication-enforcement',
                    },
                ],
            },
        },
    };
};
