import { c } from 'ttag';
import { SettingsParagraph, SettingsSection } from '@proton/components';
import ImportCsvContactButton from '@proton/components/containers/contacts/widget/ImportCsvContactButton';

const ImportCsvSection = () => (
    <SettingsSection>
        <SettingsParagraph>
            {c('Info')
                .t`We support importing CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps. We also support importing vCard 4.0. (UTF-8 encoding).`}
        </SettingsParagraph>

        <div>
            <ImportCsvContactButton />
        </div>
    </SettingsSection>
);

export default ImportCsvSection;
