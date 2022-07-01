import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    close: () => void;
}

const RenameButton = ({ shareId, link, close }: Props) => {
    const { openRename } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() => openRename(shareId, link)}
            close={close}
        />
    );
};

export default RenameButton;
