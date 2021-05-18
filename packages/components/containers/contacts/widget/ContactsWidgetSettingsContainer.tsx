import React from 'react';
import { c } from 'ttag';

import { Label, Field, Info, PrimaryButton, FullLoader, Tooltip } from '../../../components';
import { useContacts, useMailSettings, useModals, useUserKeys } from '../../../hooks';
import AutoSaveContactsToggle from '../../general/AutoSaveContactsToggle';
import ExportContactsModal from '../modals/ExportContactsModal';

interface Props {
    onClose: () => void;
    onImport: () => void;
}

const ContactsWidgetSettingsContainer = ({ onClose, onImport }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { AutoSaveContacts } = mailSettings || {};
    const { createModal } = useModals();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [contacts, loadingContacts] = useContacts();

    const hasNoContacts = !contacts?.length;

    const loading = loadingContacts || loadingMailSettings;

    const handleExport = () => {
        createModal(<ExportContactsModal userKeysList={userKeysList} />);
        onClose();
    };

    const exportButton = (
        <PrimaryButton disabled={loadingUserKeys || hasNoContacts} id="export-contacts-button" onClick={handleExport}>
            {c('Action').t`Export contacts`}
        </PrimaryButton>
    );

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
                            <span className="mr0-5 text-semibold">{c('Label').t`Automatically save contacts`}</span>
                            <Info url="https://protonmail.com/support/knowledge-base/autosave-contact-list/" />
                        </Label>
                        <Field className="pt0-5">
                            <AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />
                        </Field>
                    </div>
                    <div className="mb2">
                        <Label htmlFor="import-contacts-button" className="text-semibold">
                            {c('Label').t`Import contacts`}
                        </Label>
                        <p className="color-weak mt0-5 mb1">
                            {c('Info')
                                .t`We support importing CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps. We also support importing vCard 4.0. (UTF-8 encoding).`}
                        </p>
                        <PrimaryButton id="import-contacts-button" onClick={onImport}>
                            {c('Action').t`Import contacts`}
                        </PrimaryButton>
                    </div>
                    <div className="mb2">
                        <Label htmlFor="export-contacts-button" className="text-semibold">
                            {c('Label').t`Export contacts`}
                        </Label>
                        <p className="color-weak mt0-5 mb1">
                            {c('Info')
                                .t`The application needs to locally decrypt your contacts before they can be exported. At the end of the process, a VCF file will be generated and you will be able to download it.`}
                        </p>
                        {hasNoContacts ? (
                            <Tooltip title={c('Tooltip').t`You do not have any contacts to export`}>
                                <span className="inline-block">{exportButton}</span>
                            </Tooltip>
                        ) : (
                            exportButton
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ContactsWidgetSettingsContainer;
