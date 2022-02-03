import { c } from 'ttag';
import { SectionConfig } from '@proton/components';
import { Organization, UserModel, UserType } from '@proton/shared/lib/interfaces';

export const getOrganizationAppRoutes = ({ user, organization }: { user: UserModel; organization: Organization }) => {
    const canHaveOrganization = !user.isMember && !user.isSubUser && user.Type !== UserType.EXTERNAL;
    const hasOrganization = !!organization?.HasKeys;
    return {
        available: canHaveOrganization,
        header: c('Settings section title').t`Organization`,
        routes: {
            users: <SectionConfig>{
                text: c('Title').t`Users and addresses`,
                to: '/users-addresses',
                icon: 'people',
                available: hasOrganization && user.isAdmin && !user.isSubUser,
                subsections: [
                    {
                        id: 'members',
                    },
                    {
                        text: c('Title').t`Addresses`,
                        id: 'addresses',
                    },
                ],
            },
            domains: <SectionConfig>{
                text: c('Title').t`Domain names`,
                to: '/domain-names',
                icon: 'globe',
                available: hasOrganization && user.isAdmin,
                subsections: [
                    { id: 'domains' },
                    {
                        text: c('Title').t`Catch-all address`,
                        id: 'catch-all',
                    },
                ],
            },
            orgKeys: <SectionConfig>{
                text: c('Title').t`Organization and keys`,
                to: '/organization-keys',
                icon: 'shield',
                available: hasOrganization && user.isAdmin && !user.isSubUser,
                subsections: [
                    {
                        text: c('Title').t`Organization`,
                        id: 'organization',
                    },
                    {
                        text: c('Title').t`Password and keys`,
                        id: 'password-keys',
                    },
                ],
            },
            setup: <SectionConfig>{
                text: c('Title').t`Multi-user support`,
                to: '/multi-user-support',
                icon: 'people',
                available: !hasOrganization && canHaveOrganization,
                subsections: [
                    {
                        text: c('Title').t`Multi-user support`,
                        id: 'name',
                    },
                ],
            },
        },
    };
};
