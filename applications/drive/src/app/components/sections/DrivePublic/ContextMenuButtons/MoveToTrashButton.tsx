import { c } from 'ttag';

import type { DecryptedLink } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

export const MoveToTrashButton = ({ close }: Props) => {
    // TODO: Implement moveToTrash public action
    return (
        <ContextMenuButton
            name={c('Action').t`Move to trash`}
            icon="trash"
            testId="context-menu-trash"
            action={() => alert('Moved to trash action')}
            close={close}
        />
    );
};
