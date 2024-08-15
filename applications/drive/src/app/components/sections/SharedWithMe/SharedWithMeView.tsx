import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDriveSharingFlags, useSharedWithMeView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import SharedWithMe from './SharedWithMe';
import SharedWithMeToolbar from './SharedWithMeToolbar';

const SharedWithMeView = () => {
    useAppTitle(c('Title').t`Shared with me`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const sharedWithMeView = useSharedWithMeView(activeShareId);
    const hasSharedItems = !!sharedWithMeView.items.length;

    const { isSharingInviteAvailable } = useDriveSharingFlags();
    if (!hasSharedItems && !isSharingInviteAvailable) {
        return null;
    }

    // rootShareId is unique per item in shared with me section, so we can use it as id key
    return (
        <FileBrowserStateProvider itemIds={sharedWithMeView.items.map(({ rootShareId }) => rootShareId)}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Shared with me`}</span>}
                toolbar={<SharedWithMeToolbar shareId={activeShareId} items={sharedWithMeView.items} />}
            />
            <SharedWithMe shareId={activeShareId} sharedWithMeView={sharedWithMeView} />
        </FileBrowserStateProvider>
    );
};

export default SharedWithMeView;
