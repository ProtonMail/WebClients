import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getImportExportAppUrl } from '@proton/shared/lib/helpers/url';

import { SettingsCardSection } from '../account/SettingsCardSection';

const ImportExportAppSection = () => {
    return (
        <SettingsCardSection
            title={c('Title').t`${MAIL_APP_NAME} Export Tool`}
            description={
                <>
                    {c('Info')
                        .t`The ${MAIL_APP_NAME} Export Tool lets you export decrypted emails from your ${MAIL_APP_NAME} account to your device. You can then view the messages or import them into another email account or email client.`}
                    <br />
                    {c('Info').t`Available on macOS, Windows, and Linux.`}
                </>
            }
            actions={
                <ButtonLike color="norm" as={Href} href={getImportExportAppUrl()}>
                    {c('Action').t`Download the ${MAIL_APP_NAME} Export Tool`}
                </ButtonLike>
            }
        />
    );
};

export default ImportExportAppSection;
