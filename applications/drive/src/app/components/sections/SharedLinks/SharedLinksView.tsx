import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import SharedLinksContentProvider from './SharedLinksContentProvider';
import SharedLinksToolbar from './SharedLinksToolbar';
import SharedLinks from './SharedLinks';

const SharedLinksView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    return (
        <SharedLinksContentProvider shareId={activeShareId}>
            <SharedLinksToolbar shareId={activeShareId} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom">{c('Info').t`My Links`}</div>
                <SharedLinks shareId={activeShareId} />
            </PrivateMainArea>
        </SharedLinksContentProvider>
    );
};

export default SharedLinksView;
