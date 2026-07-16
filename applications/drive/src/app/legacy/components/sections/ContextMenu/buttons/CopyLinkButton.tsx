import { c } from 'ttag';

import { IcLink } from '@proton/icons/icons/IcLink';

import { useActions } from '../../../../../legacy/store';
import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    shareId: string;
    linkId: string;
    close: () => void;
}

const CopyLinkButton = ({ shareId, linkId, close }: Props) => {
    const { copyShareLinkToClipboard } = useActions(); // We can use it here since we don't need confirmModal
    const title = c('Action').t`Copy link`;

    if (!copyShareLinkToClipboard) {
        return null;
    }

    return (
        <ContextMenuButton
            name={title}
            icon={<IcLink />}
            testId="context-menu-copy-link"
            action={() => copyShareLinkToClipboard(new AbortController().signal, shareId, linkId)}
            close={close}
        />
    );
};

export default CopyLinkButton;
