import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { type DecryptedLink, useActions } from '../../../store';
import { useRenameModal } from '../../modals/RenameModal';
import { isMultiSelect, noSelection } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const RenameButton = ({ selectedLinks }: Props) => {
    const { renameLink } = useActions();
    const [renameModal, showRenameModal] = useRenameModal();

    if (noSelection(selectedLinks) || isMultiSelect(selectedLinks)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Rename`}
                icon={<Icon name="pen-square" alt={c('Action').t`Rename`} />}
                onClick={() => showRenameModal({ item: selectedLinks[0], renameLink })}
                data-testid="toolbar-rename"
            />
            {renameModal}
        </>
    );
};

export default RenameButton;
