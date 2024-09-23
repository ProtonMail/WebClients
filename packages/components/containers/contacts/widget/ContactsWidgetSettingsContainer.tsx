import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import Field from '@proton/components/components/container/Field';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import { useContacts, useMailSettings } from '@proton/components/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import AutoSaveContactsToggle from '../../general/AutoSaveContactsToggle';
import ContactsWidgetSettingsContainerExport from './ContactsWidgetSettingsContainerExport';
import ContactsWidgetSettingsContainerImport from './ContactsWidgetSettingsContainerImport';

interface Props {
    onImport: () => void;
    onExport: () => void;
    onClose?: () => void;
}

const ContactsWidgetSettingsContainer = ({ onImport, onExport, onClose }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { AutoSaveContacts } = mailSettings || {};
    const [, loadingContacts] = useContacts();

    const loading = loadingContacts || loadingMailSettings;

    const handleImport = () => {
        onImport();
        onClose?.();
    };

    const handleExport = () => {
        onExport();
        onClose?.();
    };

    return (
        <>
            {loading ? (
                <div className="flex h-full pb-7">
                    <CircleLoader className="m-auto color-primary" size="large" />
                </div>
            ) : (
                <div className="p-4 pt-0 overflow-auto h-full">
                    <div className="flex mb-4 flex-column md:flex-row">
                        <Label htmlFor="saveContactToggle">
                            <span className="mr-2 text-semibold" role="heading" aria-level={2}>{c('Label')
                                .t`Automatically save contacts`}</span>
                            <Info url={getKnowledgeBaseUrl('/autosave-contact-list')} />
                        </Label>
                        <Field className="pt-2">
                            <AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />
                        </Field>
                    </div>
                    <div className="mb-8">
                        <ContactsWidgetSettingsContainerImport onImport={handleImport} onClose={onClose} />
                    </div>
                    <div className="mb-8">
                        <ContactsWidgetSettingsContainerExport onExport={handleExport} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ContactsWidgetSettingsContainer;
