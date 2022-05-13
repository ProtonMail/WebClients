import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../store';
import useOpenModal from '../../useOpenModal';
import { noSelection, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const RenameButton = ({ shareId, selectedLinks }: Props) => {
    const { openRename } = useOpenModal();

    if (noSelection(selectedLinks) || isMultiSelect(selectedLinks)) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Rename`}
            icon={<Icon name="pen-square" />}
            onClick={() => openRename(shareId, selectedLinks[0])}
            data-testid="toolbar-rename"
        />
    );
};

export default RenameButton;
