import { c } from 'ttag';

import { Label } from '@proton/components';
import { EASY_SWITCH_SOURCE } from '@proton/shared/lib/interfaces/EasySwitch';

import ImportCsvContactButton from './ImportCsvContactButton';

interface Props {
    onImport: () => void;
}

const ContactsWidgetSettingsContainerImport = ({ onImport }: Props) => (
    <>
        <Label htmlFor="import-contacts-button" className="text-semibold">
            <span role="heading" aria-level={2}>{c('Label').t`Import contacts`}</span>
        </Label>

        <p className="color-weak mt0-5 mb1">
            {c('Info')
                .t`CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps as well as vCard 3.1 and 4.0 formats (UTF-8 encoding) are supported.`}
        </p>

        <ImportCsvContactButton easySwitchSource={EASY_SWITCH_SOURCE.CONTACTS_WIDGET_SETTINGS} onImport={onImport} />
    </>
);

export default ContactsWidgetSettingsContainerImport;
