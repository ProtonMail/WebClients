import { c } from 'ttag';

import { MimeIcon } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewSheetButton = ({ close, action }: Props) => {
    return (
        <ContextMenuButton
            testId="context-menu-new-sheet"
            icon={<MimeIcon name="proton-sheet" className="mr-2" />}
            name={c('sheets_2025:Action').t`New spreadsheet`}
            action={action}
            close={close}
        />
    );
};

export default CreateNewSheetButton;
