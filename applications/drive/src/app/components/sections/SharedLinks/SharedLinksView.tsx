import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import { useSharedLinksView } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { mapDecryptedLinksToChildren } from '../helpers';
import SharedLinksToolbar from './SharedLinksToolbar';
import SharedLinks from './SharedLinks';

const SharedLinksView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const sharedLinksView = useSharedLinksView(activeShareId);
    const selectedItems = mapDecryptedLinksToChildren(sharedLinksView.selectionControls.selectedItems);

    return (
        <>
            <SharedLinksToolbar shareId={activeShareId} selectedItems={selectedItems} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`My Links`}</div>
                <SharedLinks shareId={activeShareId} sharedLinksView={sharedLinksView} />
            </PrivateMainArea>
        </>
    );
};

export default SharedLinksView;
