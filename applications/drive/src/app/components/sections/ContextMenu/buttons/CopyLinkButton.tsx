import { c } from 'ttag';

import { useActions } from '../../../../store';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    linkId: string;
    close: () => void;
}

const CopyLinkButton = ({ shareId, linkId, close }: Props) => {
    const { copyShareLinkToClipboard } = useActions(); // We can use it here since we don't need confirmModal

    if (!copyShareLinkToClipboard) {
        return null;
    }

    return (
        <ContextMenuButton
            name={c('Action').t`Copy link`}
            icon="link"
            testId="context-menu-copy-link"
            action={() => copyShareLinkToClipboard(new AbortController().signal, shareId, linkId)}
            close={close}
        />
    );
};

export default CopyLinkButton;
