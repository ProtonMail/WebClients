import { c } from 'ttag';

import type { DecryptedLink } from '../../../../store';
import { type useRenameModal } from '../../../modals/RenameModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    link: DecryptedLink;
    showRenameModal: ReturnType<typeof useRenameModal>[1];
    close: () => void;
}

export const RenameButton = ({ close }: Props) => {
    // TODO: Implement renameLink public action
    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() => alert('Rename action')}
            close={close}
        />
    );
};
