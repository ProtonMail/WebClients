import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import { getImportExportAppUrl } from '@proton/shared/lib/helpers/url';

import { SettingsParagraph, SettingsSection } from '../account';

const ImportExportAppSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`The Import-Export app allows you to export messages for local backups and to restore previous backups to your account.`}
                <br />
                {c('Info').t`Available on macOS, Windows, and Linux.`}
            </SettingsParagraph>

            <ButtonLike color="norm" as={Href} href={getImportExportAppUrl()}>
                {c('Action').t`Download the Import-Export app`}
            </ButtonLike>
        </SettingsSection>
    );
};

export default ImportExportAppSection;
