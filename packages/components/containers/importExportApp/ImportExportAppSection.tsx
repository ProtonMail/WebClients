import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getImportExportAppUrl } from '@proton/shared/lib/helpers/url';

const ImportExportAppSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`The ${MAIL_APP_NAME} Export Tool lets you export decrypted emails from your ${MAIL_APP_NAME} account to your device. You can then view the messages or import them into another email account or email client.`}
                <br />
                {c('Info').t`Available on macOS, Windows, and Linux.`}
            </SettingsParagraph>

            <ButtonLike color="norm" as={Href} href={getImportExportAppUrl()}>
                {c('Action').t`Download the ${MAIL_APP_NAME} Export Tool`}
            </ButtonLike>
        </SettingsSection>
    );
};

export default ImportExportAppSection;
