import { c } from 'ttag';

import { Label, PrimaryButton, Tooltip } from '@proton/components';
import { useContacts, useModals, useUserKeys } from '@proton/components/hooks';

import ExportContactsModal from '../modals/ExportContactsModal';

interface Props {
    onExportButtonClick?: () => void;
}

interface ExportButtonProps {
    onClick?: () => void;
    hasNoContacts: boolean;
}

const ExportButton = ({ onClick, hasNoContacts }: ExportButtonProps) => {
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const { createModal } = useModals();

    return (
        <PrimaryButton
            disabled={loadingUserKeys || hasNoContacts}
            id="export-contacts-button"
            onClick={() => {
                createModal(<ExportContactsModal userKeysList={userKeysList} />);
                if (onClick !== undefined) {
                    onClick();
                }
            }}
        >
            {c('Action').t`Export contacts`}
        </PrimaryButton>
    );
};

const ContactsWidgetSettingsContainerExport = ({ onExportButtonClick }: Props) => {
    const [contacts] = useContacts();
    const hasNoContacts = !contacts?.length;

    return (
        <>
            <Label htmlFor="export-contacts-button" className="text-semibold">
                <span role="heading" aria-level={2}>{c('Label').t`Export contacts`}</span>
            </Label>
            <p className="color-weak mt0-5 mb1">
                {c('Info')
                    .t`The application needs to locally decrypt your contacts before they can be exported. At the end of the process, a VCF file will be generated and you will be able to download it.`}
            </p>
            {hasNoContacts ? (
                <Tooltip title={c('Tooltip').t`You do not have any contacts to export`}>
                    <span className="inline-block">
                        <ExportButton onClick={onExportButtonClick} hasNoContacts={hasNoContacts} />
                    </span>
                </Tooltip>
            ) : (
                <ExportButton onClick={onExportButtonClick} hasNoContacts={hasNoContacts} />
            )}
        </>
    );
};

export default ContactsWidgetSettingsContainerExport;
