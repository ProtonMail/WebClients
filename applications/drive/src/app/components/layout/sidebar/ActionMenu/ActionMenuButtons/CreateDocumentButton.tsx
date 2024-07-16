import { c } from 'ttag';

import { DropdownMenuButton, MimeIcon } from '@proton/components';

interface Props {
    onClick: () => void;
}

const CreateDocumentButton = ({ onClick }: Props) => {
    return (
        <DropdownMenuButton
            className="text-left flex items-center justify-space-between"
            onClick={onClick}
            data-testid="dropdown-create-document"
        >
            <span className="flex items-center">
                <MimeIcon name="proton-doc" className="mr-2" />
                {
                    // translator: Action button in sidebar dropdown to create a new Proton Document
                    c('Action').t`New document`
                }
            </span>
        </DropdownMenuButton>
    );
};

export default CreateDocumentButton;
