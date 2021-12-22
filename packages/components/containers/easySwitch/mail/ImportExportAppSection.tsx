import { c } from 'ttag';

import { Button } from '../../../components';

import { SettingsSection, SettingsParagraph } from '../../account';

const DOWNLOAD_URL = 'https://protonmail.com/import-export';

const ImportExportAppSection = () => {
    const handleClick = () => {
        window.open(DOWNLOAD_URL);
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`The Import-Export app allows you to export messages for local backups and to restore previous backups to your account.`}
                <br />
                {c('Info').t`Available on macOS, Windows, and Linux.`}
            </SettingsParagraph>

            <Button color="norm" onClick={handleClick}>
                {c('Action').t`Download the Import-Export app`}
            </Button>
        </SettingsSection>
    );
};

export default ImportExportAppSection;
