import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import { useRenameModal } from '../../../modals/RenameModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    link: DecryptedLink;
    showRenameModal: ReturnType<typeof useRenameModal>[1];
    close: () => void;
}

const RenameButton = ({ link, showRenameModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() => showRenameModal({ item: link })}
            close={close}
        />
    );
};

export default RenameButton;
