import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { MimeProtonSheet } from '@proton/file-icons/icons/MimeProtonSheet';

interface Props {
    onClick: () => void;
}

export const CreateSheetButton = ({ onClick }: Props) => {
    return (
        <DropdownMenuButton
            className="text-left flex items-center justify-space-between"
            onClick={onClick}
            data-testid="dropdown-create-sheet"
        >
            <span className="flex items-center">
                <MimeProtonSheet className="mr-2" />
                <span className="mr-2">{
                    // translator: Action button in sidebar dropdown to create a new Proton Sheet
                    c('sheets_2025:Action').t`New spreadsheet`
                }</span>
            </span>
        </DropdownMenuButton>
    );
};
