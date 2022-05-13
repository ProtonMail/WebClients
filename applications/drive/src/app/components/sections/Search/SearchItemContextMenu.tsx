import { ContextSeparator } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import { DriveItemContextMenu } from '../Drive/DriveItemContextMenu';
import { GoToParent } from './ContextMenuButtons';

export default function generateSearchItemContextMenu(shareId: string, selectedLinks: DecryptedLink[]) {
    return function SearchItemContextMenuWrapper(props: ContextMenuProps) {
        return <SearchItemContextMenu shareId={shareId} selectedLinks={selectedLinks} {...props} />;
    };
}

function SearchItemContextMenu(
    props: ContextMenuProps & {
        shareId: string;
        selectedLinks: DecryptedLink[];
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
