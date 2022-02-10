import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const StopSharingButton = ({ shareId, items, close }: Props) => {
    const { stopSharingLinks } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-broken"
            testId="context-menu-stop-sharing"
            action={() =>
                stopSharingLinks(
                    new AbortController().signal,
                    shareId,
                    items.map((item) => ({
                        parentLinkId: item.ParentLinkID,
                        linkId: item.LinkID,
                        name: item.Name,
                        type: item.Type,
                    }))
                )
            }
            close={close}
        />
    );
};

export default StopSharingButton;
