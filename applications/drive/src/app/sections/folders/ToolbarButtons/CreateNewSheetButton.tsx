import { c } from 'ttag';

import { MimeIcon, ToolbarButton } from '@proton/components';

interface CreateNewSheetButtonProps {
    onClick: () => void;
}

export const CreateNewSheetButton = ({ onClick }: CreateNewSheetButtonProps) => {
    return (
        <ToolbarButton
            icon={<MimeIcon name="proton-sheet" />}
            title={c('sheets_2025:Action').t`New spreadsheet`}
            onClick={onClick}
            data-testid="toolbar-new-sheet"
        />
    );
};
