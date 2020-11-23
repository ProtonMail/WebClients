import React from 'react';
import { c } from 'ttag';
import { LabelsSection, FoldersSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getLabelsPage = () => {
    return {
        text: c('Title').t`Folders & labels`,
        to: '/settings/labels',
        icon: 'folder-label',
        subsections: [
            {
                text: c('Title').t`Folders`,
                id: 'folderlist',
            },
            {
                text: c('Title').t`Labels`,
                id: 'labellist',
            },
        ],
    };
};

const FoldersLabelsContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getLabelsPage()}
            setActiveSection={setActiveSection}
        >
            <FoldersSection />
            <LabelsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default FoldersLabelsContainer;
