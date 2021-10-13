import { c } from 'ttag';

import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { Label, Field, Info, PrimaryButton, FullLoader, Tooltip, Button, GoogleButton } from '../../../components';
import { useAddresses, useContacts, useFeature, useMailSettings, useModals, useUserKeys } from '../../../hooks';

import AutoSaveContactsToggle from '../../general/AutoSaveContactsToggle';
import { ImportAssistantOauthModal } from '../../easySwitch';
import ExportContactsModal from '../modals/ExportContactsModal';
import { FeatureCode } from '../../features';

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
    const [addresses, loadingAddresses] = useAddresses();

    const isEasySwitchEnabled = useFeature(FeatureCode.EasySwitch).feature?.Value;

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

    const handleOAuthClick = () => {
        createModal(<ImportAssistantOauthModal addresses={addresses} defaultCheckedTypes={[ImportType.CONTACTS]} />);
    };

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
                        <Label htmlFor="import-contacts-button" className="text-semibold">
                            <span role="heading" aria-level={2}>{c('Label').t`Import contacts`}</span>
                        </Label>

                        <p className="color-weak mt0-5 mb1">
                            {c('Info')
                                .t`We support importing CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps. We also support importing vCard 4.0. (UTF-8 encoding).`}
                        </p>

                        {isEasySwitchEnabled && (
                            <GoogleButton onClick={handleOAuthClick} disabled={loadingAddresses} className="mr1" />
                        )}

                        <Button id="import-contacts-button" onClick={onImport}>
                            {c('Action').t`Import from .csv or vCard`}
                        </Button>
                    </div>
                    <div className="mb2">
                        <Label htmlFor="export-contacts-button" className="text-semibold">
                            <span role="heading" aria-level={2}>{c('Label').t`Export contacts`}</span>
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
