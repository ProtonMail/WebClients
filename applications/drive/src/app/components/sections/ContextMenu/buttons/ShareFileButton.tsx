import { c } from 'ttag';

import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    close: () => void;
}

const ShareButton = ({ shareId, close }: Props) => {
    const { openFileSharing } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Get link`}
            icon="link"
            testId="context-menu-shareViaLink"
            action={() => openFileSharing(shareId)}
            close={close}
        />
    );
};

export default ShareButton;
