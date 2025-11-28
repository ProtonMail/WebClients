import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill/Pill';
import { DropdownMenuButton, MimeIcon } from '@proton/components';

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
                <MimeIcon name="proton-sheet" className="mr-2" />
                <span className="mr-2">{
                    // translator: Action button in sidebar dropdown to create a new Proton Sheet
                    c('sheets_2025:Action').t`New spreadsheet`
                }</span>
                <Pill>{c('Label').t`New`}</Pill>
            </span>
        </DropdownMenuButton>
    );
};
