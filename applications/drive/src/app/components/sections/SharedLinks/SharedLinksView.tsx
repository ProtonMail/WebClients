import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import { useSharedLinksView } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import SharedLinksToolbar from './SharedLinksToolbar';
import SharedLinks from './SharedLinks';

const SharedLinksView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const sharedLinksView = useSharedLinksView(activeShareId);

    return (
        <>
            <SharedLinksToolbar
                shareId={activeShareId}
                selectedLinks={sharedLinksView.selectionControls.selectedItems}
            />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`My Links`}</div>
                <SharedLinks shareId={activeShareId} sharedLinksView={sharedLinksView} />
            </PrivateMainArea>
        </>
    );
};

export default SharedLinksView;
