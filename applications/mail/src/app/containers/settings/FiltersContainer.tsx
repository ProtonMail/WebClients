import React from 'react';
import { c } from 'ttag';
import { FiltersSection, SpamFiltersSection, RelatedSettingsSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getFiltersPage = () => {
    return {
        text: c('Title').t`Filters`,
        to: '/settings/filters',
        icon: 'filter',
        subsections: [
            {
                text: c('Title').t`Custom filters`,
                id: 'custom',
            },
            {
                text: c('Title').t`Spam filters`,
                id: 'spam',
            },
            {
                text: c('Title').t`Related features`,
                id: 'related-features',
                hide: true,
            },
        ],
    };
};

const FiltersContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getFiltersPage()}
            setActiveSection={setActiveSection}
        >
            <FiltersSection />
            <SpamFiltersSection />
            <RelatedSettingsSection
                list={[
                    {
                        icon: 'folder-label',
                        text: c('Info').t`Create and manage your folders and labels.`,
                        link: c('Link').t`Manage folders and labels`,
                        to: '/settings/labels',
                    },
                    {
                        icon: 'auto-reply',
                        text: c('Info')
                            .t`Create automatic email replies while you're away from your ProtonMail account.`,
                        link: c('Link').t`Create auto-reply`,
                        to: '/settings/auto-reply',
                    },
                ]}
            />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default FiltersContainer;
