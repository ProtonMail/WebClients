import { ContextSeparator } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import type { DecryptedLink } from '../../../store';
import type { ContextMenuProps } from '../../FileBrowser/interface';
import { DriveItemContextMenu } from '../Drive/DriveContextMenu';
import { GoToParent } from './ContextMenuButtons';

export function SearchItemContextMenu(
    props: ContextMenuProps & {
        shareId: string;
        selectedLinks: DecryptedLink[];
        permissions: SHARE_MEMBER_PERMISSIONS;
    }
) {
    const { shareId, selectedLinks, close } = props;

    const isOnlyOneItem = selectedLinks.length === 1;

    return (
        <DriveItemContextMenu {...props}>
            {isOnlyOneItem && (
                <>
                    <ContextSeparator />
                    <GoToParent shareId={shareId} parentLinkId={selectedLinks[0].parentLinkId} close={close} />
                </>
            )}
        </DriveItemContextMenu>
    );
}
