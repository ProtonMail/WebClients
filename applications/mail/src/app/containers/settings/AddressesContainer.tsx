import React from 'react';
import { c } from 'ttag';
import {
    PmMeSection,
    AddressesSection,
    RelatedSettingsSection,
    useOrganization,
    SettingsPropsShared,
    AppLink,
} from 'react-components';
import { UserModel } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getAddressesPage = (user: UserModel) => {
    return {
        text: c('Title').t`Addresses`,
        to: '/settings/addresses',
        icon: 'addresses',
        subsections: [
            {
                text: c('Title').t`My addresses`,
                id: 'addresses',
            },
            user.canPay &&
                !user.isSubUser && {
                    text: c('Title').t`Short domain (@pm.me)`,
                    id: 'pmme',
                },
            user.canPay && {
                text: c('Title').t`Related features`,
                id: 'related-features',
                hide: true,
            },
        ].filter(isTruthy),
    };
};

const getList = ({ MaxMembers = 0, MaxAddresses = 0 } = {}) => {
    if (MaxMembers > 1) {
        return [
            {
                icon: 'identity',
                text: c('Info').t`Edit the display name and signature for each of your email addresses.`,
                link: c('Link').t`Manage identity`,
                to: '/settings/identity',
            },
            {
                icon: 'contacts-group-people',
                text: c('Info').t`Manage all custom domains and addresses for your organization.`,
                link: (
                    <AppLink to="/organization" toApp={getAccountSettingsApp()} className="button--primary mtauto">
                        {c('Action').t`Manage organization`}
                    </AppLink>
                ),
            },
        ];
    }

    if (MaxAddresses > 1) {
        return [
            {
                icon: 'identity',
                text: c('Info').t`Edit the display name and signature for each of your email addresses.`,
                link: c('Link').t`Manage identity`,
                to: '/settings/identity',
            },
            {
                icon: 'contacts-group-people',
                text: c('Info')
                    .t`Upgrade to a multi-user plan if you want to create and manage the users of your organization.`,
                link: (
                    <AppLink to="/subscription" toApp={getAccountSettingsApp()} className="button--primary mtauto">
                        {c('Action').t`Upgrade`}
                    </AppLink>
                ),
            },
        ];
    }

    return [
        {
            icon: 'domains',
            text: c('Info').t`Upgrade to a paid plan if you want to create and manage custom domains.`,
            link: (
                <AppLink to="/subscription" toApp={getAccountSettingsApp()} className="button--primary mtauto">
                    {c('Action').t`Upgrade`}
                </AppLink>
            ),
        },
        {
            icon: 'contacts-group-people',
            text: c('Info')
                .t`Upgrade to a multi-user plan if you want to create and manage the users of your organization.`,
            link: (
                <AppLink to="/subscription" toApp={getAccountSettingsApp()} className="button--primary mtauto">
                    {c('Action').t`Upgrade`}
                </AppLink>
            ),
        },
    ];
};

interface Props extends SettingsPropsShared {
    user: UserModel;
}

const AddressesContainer = ({ setActiveSection, location, user }: Props) => {
    const [organization] = useOrganization();
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAddressesPage(user)}
            setActiveSection={setActiveSection}
        >
            <AddressesSection isOnlySelf />
            <PmMeSection user={user} />
            {user.canPay ? <RelatedSettingsSection list={getList(organization)} /> : null}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AddressesContainer;
