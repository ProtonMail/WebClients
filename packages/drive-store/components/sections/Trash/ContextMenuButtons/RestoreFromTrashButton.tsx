import { c } from 'ttag';

import type { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    restoreLinks: ReturnType<typeof useActions>['restoreLinks'];
    close: () => void;
}

const RestoreFromTrashButton = ({ selectedLinks, restoreLinks, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Restore from trash`}
            icon="arrow-rotate-right"
            testId="context-menu-restore"
            action={() => restoreLinks(new AbortController().signal, selectedLinks)}
            close={close}
        />
    );
};

export default RestoreFromTrashButton;
