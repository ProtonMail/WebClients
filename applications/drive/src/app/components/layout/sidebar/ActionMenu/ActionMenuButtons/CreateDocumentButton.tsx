import { c } from 'ttag';

import { DropdownMenuButton, NewFeatureTag } from '@proton/components';
import documentIcon from '@proton/styles/assets/img/drive/file-document-proton.svg';

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
            <span>
                <img className="mr-2 pointer-events-none" src={documentIcon} alt="" aria-hidden="true" />
                {
                    // translator: Action button in sidebar dropdown to create a new Proton Document
                    c('Action').t`New document`
                }
            </span>
            <NewFeatureTag featureKey="documents" className="text-sm" />
        </DropdownMenuButton>
    );
};

export default CreateDocumentButton;
