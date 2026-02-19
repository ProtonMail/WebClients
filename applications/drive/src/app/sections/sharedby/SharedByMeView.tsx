import { useEffect, useMemo } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { SharedByMe } from './SharedByMe';
import SharedByMeToolbar from './SharedByMeToolbar';
import { useSharedByMeNodesLoader } from './loaders/useSharedByMeNodesLoader';
import { useSharedByMeStore } from './useSharedByMe.store';

export const SharedByMeView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { setDefaultRoot, activeShareId } = useActiveShare();

    const { loadSharedByMeNodes } = useSharedByMeNodesLoader();
    const itemUidsSet = useSharedByMeStore((state) => state.itemUids);
    const itemUids = useMemo(() => Array.from(itemUidsSet), [itemUidsSet]);

    useEffect(setDefaultRoot, []);

    useEffect(() => {
        const abortController = new AbortController();

        void loadSharedByMeNodes(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [loadSharedByMeNodes]);

    return (
        <FileBrowserStateProvider itemIds={itemUids}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`My Links`}</span>}
                toolbar={<SharedByMeToolbar uids={itemUids} shareId={activeShareId} />}
            />
            <SharedByMe shareId={activeShareId} />
        </FileBrowserStateProvider>
    );
};
