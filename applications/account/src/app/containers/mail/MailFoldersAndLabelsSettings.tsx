import React from 'react';
import { c } from 'ttag';

import { LabelsSection, FoldersSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getLabelsPage = () => {
    return {
        text: c('Title').t`Folders & labels`,
        to: '/mail/folders-labels',
        icon: 'folder-label',
        description: c('Settings description')
            .t`You can apply multiple labels to a single message, but messages can usually only be in a single folder. Drag and drop to rearrange the order of your folders and labels.`,
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

const MailFoldersAndLabelsSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getLabelsPage()}>
            <FoldersSection />
            <LabelsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailFoldersAndLabelsSettings;
