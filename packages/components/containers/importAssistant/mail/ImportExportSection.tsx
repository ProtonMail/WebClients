import React from 'react';
import { c } from 'ttag';

import { Button } from '../../../components';

import { SettingsSection, SettingsParagraph } from '../../account';

const DOWNLOAD_URL = 'https://protonmail.com/import-export';

const ImportExportSection = () => {
    const handleClick = () => {
        window.open(DOWNLOAD_URL);
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`For advanced security, the Import-Export app encrypts emails on your device before migrating them to Proton servers. You can also export messages for local backups.`}
                <br />
                {c('Info').t`Available on macOS, Windows, and Linux.`}
            </SettingsParagraph>

            <Button color="norm" onClick={handleClick}>
                {c('Action').t`Download the Import-Export app`}
            </Button>
        </SettingsSection>
    );
};

export default ImportExportSection;
