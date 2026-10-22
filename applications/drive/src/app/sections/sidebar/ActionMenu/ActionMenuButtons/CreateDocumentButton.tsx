import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc';

interface Props {
    onClick: () => void;
}

export const CreateDocumentButton = ({ onClick }: Props) => {
    return (
        <DropdownMenuButton
            className="text-left flex items-center justify-space-between"
            onClick={onClick}
            data-testid="dropdown-create-document"
        >
            <span className="flex items-center">
                <MimeProtonDoc className="mr-2" />
                <span>{
                    // translator: Action button in sidebar dropdown to create a new Proton Document
                    c('Action').t`New document`
                }</span>
            </span>
        </DropdownMenuButton>
    );
};
