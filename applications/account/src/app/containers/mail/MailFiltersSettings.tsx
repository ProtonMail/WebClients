import React from 'react';
import { c } from 'ttag';

import { FiltersSection, SpamFiltersSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getFiltersPage = () => {
    return {
        text: c('Title').t`Filters`,
        to: '/mail/filters',
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
        ],
    };
};

const MailFiltersSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getFiltersPage()}>
            <FiltersSection />
            <SpamFiltersSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailFiltersSettings;
