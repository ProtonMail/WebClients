import { c } from 'ttag';

import { DropdownMenuButton, MimeIcon } from '@proton/components';

interface Props {
    onClick: () => void;
}

const CreateSheetButton = ({ onClick }: Props) => {
    return (
        <DropdownMenuButton
            className="text-left flex items-center justify-space-between"
            onClick={onClick}
            data-testid="dropdown-create-sheet"
        >
            <span className="flex items-center">
                <MimeIcon name="proton-sheet" className="mr-2" />
                <span>{
                    // translator: Action button in sidebar dropdown to create a new Proton Sheet
                    c('sheets_2025:Action').t`New spreadsheet`
                }</span>
            </span>
        </DropdownMenuButton>
    );
};

export default CreateSheetButton;
