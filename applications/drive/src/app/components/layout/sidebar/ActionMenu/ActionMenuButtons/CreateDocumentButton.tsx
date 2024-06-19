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
            <span className="flex items-center">
                <img className="mr-2 pointer-events-none" src={documentIcon} alt="" aria-hidden="true" />
                {
                    // translator: Action button in sidebar dropdown to create a new Proton Document
                    c('Action').t`New document`
                }
            </span>
            {/* TODO: Remove New tag when expired */}
            <NewFeatureTag featureKey="documents" endDate={new Date('2024-07-15')} />
        </DropdownMenuButton>
    );
};

export default CreateDocumentButton;
