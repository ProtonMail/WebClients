import { c } from 'ttag';

import useToolbarActions from '../../../../hooks/drive/useActions';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    close: () => void;
}

const ShareFileButton = ({ shareId, close }: Props) => {
    const { openFileSharing } = useToolbarActions();

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

export default ShareFileButton;
