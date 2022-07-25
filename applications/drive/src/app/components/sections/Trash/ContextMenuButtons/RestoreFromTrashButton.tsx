import { c } from 'ttag';

import { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const RestoreFromTrashButton = ({ selectedLinks, close }: Props) => {
    const { restoreLinks } = useActions();

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
