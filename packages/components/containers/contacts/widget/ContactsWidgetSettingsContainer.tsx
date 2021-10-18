import { c } from 'ttag';

import { Label, Field, Info, FullLoader } from '@proton/components';
import { useContacts, useMailSettings } from '@proton/components/hooks';

import AutoSaveContactsToggle from '../../general/AutoSaveContactsToggle';
import ContactsWidgetSettingsContainerExport from './ContactsWidgetSettingsContainerExport';
import ContactsWidgetSettingsContainerImport from './ContactsWidgetSettingsContainerImport';

interface Props {
    onClose: () => void;
}

const ContactsWidgetSettingsContainer = ({ onClose }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { AutoSaveContacts } = mailSettings || {};
    const [, loadingContacts] = useContacts();

    const loading = loadingContacts || loadingMailSettings;

    return (
        <>
            {loading ? (
                <div className="flex h100 pb2">
                    <FullLoader className="mauto color-primary" />
                </div>
            ) : (
                <div className="pl2 pr2 pt1 pb1 scroll-if-needed h100">
                    <div className="flex mb1 on-mobile-flex-column">
                        <Label htmlFor="saveContactToggle">
                            <span className="mr0-5 text-semibold" role="heading" aria-level={2}>{c('Label')
                                .t`Automatically save contacts`}</span>
                            <Info url="https://protonmail.com/support/knowledge-base/autosave-contact-list/" />
                        </Label>
                        <Field className="pt0-5">
                            <AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />
                        </Field>
                    </div>
                    <div className="mb2">
                        <ContactsWidgetSettingsContainerImport onImportButtonClick={onClose} />
                    </div>
                    <div className="mb2">
                        <ContactsWidgetSettingsContainerExport onExportButtonClick={onClose} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ContactsWidgetSettingsContainer;
