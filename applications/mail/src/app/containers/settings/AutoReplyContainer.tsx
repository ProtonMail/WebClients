import React from 'react';
import { AutoReplySection, RelatedSettingsSection, SettingsPropsShared } from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

const { PAID_MAIL } = PERMISSIONS;

export const getAutoReply = () => {
    return {
        text: c('Title').t`Auto-reply`,
        to: '/settings/auto-reply',
        icon: 'mailbox',
        permissions: [PAID_MAIL],
        subsections: [
            {
                text: c('Title').t`Auto-reply`,
                id: 'auto-reply',
            },
            {
                text: c('Title').t` Related features`,
                id: 'related-features',
                hide: true,
            },
        ],
    };
};

const AutoReplyContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAutoReply()}
            setActiveSection={setActiveSection}
        >
            <AutoReplySection />
            <RelatedSettingsSection
                list={[
                    {
                        icon: 'filter',
                        text: c('Info').t`Customize and manage additional auto-replies with dedicated filters.`,
                        link: c('Link').t`Customize auto-replies`,
                        to: '/settings/filters',
                    },
                ]}
            />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AutoReplyContainer;
