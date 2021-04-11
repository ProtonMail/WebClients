import React, { useEffect } from 'react';
import { c } from 'ttag';

import {
    StartImportSection,
    ImportListSection,
    ImportExportSection,
    SettingsPropsShared,
    useFeature,
    useModals,
    ImportWelcomeModal,
    FeatureCode,
} from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getImportPage = () => {
    return {
        text: c('Title').t`Import & export`,
        to: '/mail/import-export',
        icon: 'import',
        subsections: [
            {
                text: c('Title').t`Import Assistant`,
                id: 'start-import',
            },
            {
                text: c('Title').t`Current & past imports`,
                id: 'import-list',
            },
            {
                text: c('Title').t`Import-Export app`,
                id: 'import-export',
            },
        ],
    };
};

interface Props extends SettingsPropsShared {
    onChangeBlurred: (isBlurred: boolean) => void;
}

const MailImportAndExportSettings = ({ setActiveSection, location, onChangeBlurred }: Props) => {
    const { feature, loading, update } = useFeature(FeatureCode.WelcomeImportModalShown);
    const { createModal } = useModals();

    useEffect(() => {
        if (!loading && feature?.Value === false) {
            onChangeBlurred(true);
            createModal(
                <ImportWelcomeModal
                    onClose={async () => {
                        onChangeBlurred(false);
                        await update(true);
                    }}
                />
            );
        }
    }, [feature?.Value, loading]);

    return (
        <PrivateMainSettingsAreaWithPermissions
            config={getImportPage()}
            setActiveSection={setActiveSection}
            location={location}
        >
            <StartImportSection />
            <ImportListSection />
            <ImportExportSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailImportAndExportSettings;
