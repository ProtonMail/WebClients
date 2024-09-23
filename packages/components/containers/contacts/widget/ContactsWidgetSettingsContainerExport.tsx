import { c } from 'ttag';

import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import Label from '@proton/components/components/label/Label';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { useContacts } from '@proton/components/hooks';

interface ExportButtonProps {
    onClick?: () => void;
    hasNoContacts: boolean;
}

const ExportButton = ({ onClick, hasNoContacts }: ExportButtonProps) => {
    return (
        <PrimaryButton disabled={hasNoContacts} id="export-contacts-button" onClick={onClick}>
            {c('Action').t`Export contacts`}
        </PrimaryButton>
    );
};

interface Props {
    onExport?: () => void;
}

const ContactsWidgetSettingsContainerExport = ({ onExport }: Props) => {
    const [contacts] = useContacts();
    const hasNoContacts = !contacts?.length;

    return (
        <>
            <Label htmlFor="export-contacts-button" className="text-semibold">
                <span role="heading" aria-level={2}>{c('Label').t`Export contacts`}</span>
            </Label>
            <p className="color-weak mt-2 mb-4">
                {c('Info')
                    .t`The application needs to locally decrypt your contacts before they can be exported. At the end of the process, a VCF file will be generated and you will be able to download it.`}
            </p>
            {hasNoContacts ? (
                <Tooltip title={c('Tooltip').t`You do not have any contacts to export`}>
                    <span className="inline-block">
                        <ExportButton onClick={onExport} hasNoContacts={hasNoContacts} />
                    </span>
                </Tooltip>
            ) : (
                <ExportButton onClick={onExport} hasNoContacts={hasNoContacts} />
            )}
        </>
    );
};

export default ContactsWidgetSettingsContainerExport;
