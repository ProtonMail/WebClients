import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Field, Info, Label } from '@proton/components';
import { useContacts, useMailSettings } from '@proton/components/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import AutoSaveContactsToggle from '../../general/AutoSaveContactsToggle';
import ContactsWidgetSettingsContainerExport from './ContactsWidgetSettingsContainerExport';
import ContactsWidgetSettingsContainerImport from './ContactsWidgetSettingsContainerImport';

interface Props {
    onImport: () => void;
    onExport: () => void;
    onClose: () => void;
}

const ContactsWidgetSettingsContainer = ({ onImport, onExport, onClose }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { AutoSaveContacts } = mailSettings || {};
    const [, loadingContacts] = useContacts();

    const loading = loadingContacts || loadingMailSettings;

    const handleImport = () => {
        onImport();
        onClose();
    };

    const handleExport = () => {
        onExport();
        onClose();
    };

    return (
        <>
            {loading ? (
                <div className="flex h100 pb2">
                    <CircleLoader className="mauto color-primary" size="large" />
                </div>
            ) : (
                <div className="pl2 pr2 pt1 pb1 scroll-if-needed h100">
                    <div className="flex mb1 on-mobile-flex-column">
                        <Label htmlFor="saveContactToggle">
                            <span className="mr0-5 text-semibold" role="heading" aria-level={2}>{c('Label')
                                .t`Automatically save contacts`}</span>
                            <Info url={getKnowledgeBaseUrl('/autosave-contact-list')} />
                        </Label>
                        <Field className="pt0-5">
                            <AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />
                        </Field>
                    </div>
                    <div className="mb2">
                        <ContactsWidgetSettingsContainerImport onImport={handleImport} onClose={onClose} />
                    </div>
                    <div className="mb2">
                        <ContactsWidgetSettingsContainerExport onExport={handleExport} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ContactsWidgetSettingsContainer;
