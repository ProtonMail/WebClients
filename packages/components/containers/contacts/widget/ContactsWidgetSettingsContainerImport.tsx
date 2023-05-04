import { c } from 'ttag';



import { EASY_SWITCH_SOURCE } from '@proton/activation/src/interface';
import { Label } from '@proton/components';



import ImportCsvContactButton from './ImportCsvContactButton';


interface Props {
    onImport: () => void;
    onClose?: () => void;
}

const ContactsWidgetSettingsContainerImport = ({ onImport, onClose }: Props) => (
    <>
        <Label htmlFor="import-contacts-button" className="text-semibold">
            <span role="heading" aria-level={2}>{c('Label').t`Import contacts`}</span>
        </Label>

        <p className="color-weak mt-2 mb-4">
            {c('Info')
                .t`CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps as well as vCard 3.1 and 4.0 formats (UTF-8 encoding) are supported.`}
        </p>

        <ImportCsvContactButton
            easySwitchSource={EASY_SWITCH_SOURCE.CONTACTS_WIDGET_SETTINGS}
            onImport={onImport}
            onClose={onClose}
        />
    </>
);

export default ContactsWidgetSettingsContainerImport;