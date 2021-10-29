import { c } from 'ttag';
import { SettingsParagraph, SettingsSection } from '@proton/components';
import ImportCsvContactButton from '@proton/components/containers/contacts/widget/ImportCsvContactButton';
import { EASY_SWITCH_SOURCE } from '@proton/shared/lib/interfaces/EasySwitch';

interface Props {
    hideEasySwitch?: boolean;
}

const ImportCsvSection = ({ hideEasySwitch = false }: Props) => (
    <SettingsSection>
        <SettingsParagraph>
            {c('Info')
                .t`CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps as well as vCard 3.1 and 4.0 formats (UTF-8 encoding) are supported.`}
        </SettingsParagraph>

        <div>
            <ImportCsvContactButton
                easySwitchSource={EASY_SWITCH_SOURCE.IMPORT_CONTACT_SETTINGS}
                hideEasySwitch={hideEasySwitch}
            />
        </div>
    </SettingsSection>
);

export default ImportCsvSection;
