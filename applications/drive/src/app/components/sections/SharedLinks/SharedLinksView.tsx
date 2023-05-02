import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useSharedLinksView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import SharedLinks from './SharedLinks';
import SharedLinksToolbar from './SharedLinksToolbar';

const SharedLinksView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const sharedLinksView = useSharedLinksView(activeShareId);

    return (
        <FileBrowserStateProvider itemIds={sharedLinksView.items.map(({ linkId }) => linkId)}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`My Links`}</span>}
                toolbar={<SharedLinksToolbar shareId={activeShareId} items={sharedLinksView.items} />}
            />
            <SharedLinks shareId={activeShareId} sharedLinksView={sharedLinksView} />
        </FileBrowserStateProvider>
    );
};

export default SharedLinksView;
