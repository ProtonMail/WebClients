import { c } from 'ttag';
import { Label } from '@proton/components';
import ImportCsvContactButton from '@proton/components/containers/contacts/widget/ImportCsvContactButton';
import { EASY_SWITCH_SOURCE } from '@proton/shared/lib/interfaces/EasySwitch';

interface Props {
    onImportButtonClick?: () => void;
}

const ContactsWidgetSettingsContainerImport = ({ onImportButtonClick }: Props) => (
    <>
        <Label htmlFor="import-contacts-button" className="text-semibold">
            <span role="heading" aria-level={2}>{c('Label').t`Import contacts`}</span>
        </Label>

        <p className="color-weak mt0-5 mb1">
            {c('Info')
                .t`We support importing CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps. We also support importing vCard 4.0. (UTF-8 encoding).`}
        </p>

        <ImportCsvContactButton
            easySwitchSource={EASY_SWITCH_SOURCE.CONTACTS_WIDGET_SETTINGS}
            onImportButtonClick={onImportButtonClick}
        />
    </>
);

export default ContactsWidgetSettingsContainerImport;
