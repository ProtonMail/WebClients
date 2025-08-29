import { useEffect } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useAppTitle } from '@proton/components';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { SharedByMe } from './SharedByMe';
import { useSharedByMeNodesLoader } from './loaders/useSharedByMeNodesLoader';
import { useSharedByMeStore } from './useSharedByMe.store';

export const SharedByMeView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { setDefaultRoot } = useActiveShare();

    const { loadSharedByMeNodes } = useSharedByMeNodesLoader();
    const { itemUids } = useSharedByMeStore(
        useShallow((state) => ({
            itemUids: state.getItemUids(),
        }))
    );
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
                // TODO: Implement Toolbar with new logic
                toolbar={<div />}
            />
            <SharedByMe />
        </FileBrowserStateProvider>
    );
};
