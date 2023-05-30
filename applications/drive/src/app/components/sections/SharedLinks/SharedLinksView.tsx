import { useEffect } from 'react';

import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useSharedLinksView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import SharedLinks from './SharedLinks';
import SharedLinksToolbar from './SharedLinksToolbar';

const SharedLinksView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const sharedLinksView = useSharedLinksView(activeShareId);

    return (
        <FileBrowserStateProvider itemIds={sharedLinksView.items.map(({ linkId }) => linkId)}>
            <SharedLinksToolbar shareId={activeShareId} items={sharedLinksView.items} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p-4 text-strong border-bottom section--header">{c('Info').t`My Links`}</div>
                <SharedLinks shareId={activeShareId} sharedLinksView={sharedLinksView} />
            </PrivateMainArea>
        </FileBrowserStateProvider>
    );
};

export default SharedLinksView;
