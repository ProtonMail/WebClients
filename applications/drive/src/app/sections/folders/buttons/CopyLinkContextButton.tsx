import { c } from 'ttag';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { LinkShareUrl} from '../../../store';
import { useActions } from '../../../store';

type Item = {
    rootShareId: string;
    linkId: string;
    shareUrl?: LinkShareUrl;
    isExpired?: boolean;
    trashed: number | null;
};

interface Props {
    selectedItems: Item[];
    close: () => void;
}

export const CopyLinkContextButton = ({ selectedItems, close }: Props) => {
    const { copyShareLinkToClipboard } = useActions(); // We can use it here since we don't need confirmModal
    const item = selectedItems[0];
    const hasLink = selectedItems.length === 1 && item?.shareUrl && !item.shareUrl.isExpired && !item.trashed;

    if (!copyShareLinkToClipboard || !hasLink) {
        return null;
    }

    return (
        <ContextMenuButton
            name={c('Action').t`Copy link`}
            icon="link"
            testId="context-menu-copy-link"
            action={() => copyShareLinkToClipboard(new AbortController().signal, item.rootShareId, item.linkId)}
            close={close}
        />
    );
};
