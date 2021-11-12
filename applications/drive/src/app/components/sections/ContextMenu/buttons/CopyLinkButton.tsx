import { c } from 'ttag';

import useSharing from '../../../../hooks/drive/useSharing';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    close: () => void;
}

const CopyLinkButton = ({ shareId, close }: Props) => {
    const { copyShareLinkToClipboard } = useSharing();

    if (!copyShareLinkToClipboard) {
        return <></>;
    }

    return (
        <ContextMenuButton
            name={c('Action').t`Copy link`}
            icon="link"
            testId="context-menu-share-link"
            action={() => copyShareLinkToClipboard(shareId)}
            close={close}
        />
    );
};

export default CopyLinkButton;
