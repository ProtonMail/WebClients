import { useEffect } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useAppTitle } from '@proton/components';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { Actions, traceTelemetry } from '../../utils/telemetry';
import { SharedWithMe } from './SharedWithMe';
import SharedWithMeToolbar from './SharedWithMeToolbar';
import { loadBookmarks } from './loaders/loadBookmarks';
import { loadInvitations } from './loaders/loadInvitations';
import { loadSharedWithMeNodes } from './loaders/loadSharedWithMeNodes';
import { useSharedWithMeStore } from './useSharedWithMe.store';

export const SharedWithMeView = () => {
    useAppTitle(c('Title').t`Shared with me`);
    const { setDefaultRoot } = useActiveShare();

    const { itemUids } = useSharedWithMeStore(
        useShallow((state) => ({
            itemUids: state.sortedItemUids,
        }))
    );

    useEffect(() => {
        setDefaultRoot();
        void traceTelemetry(Actions.SignUpFlowAndRedirectCompleted).end();
    }, []);

    useEffect(() => {
        const abortController = new AbortController();

        void loadSharedWithMeNodes(abortController.signal);
        void loadInvitations(abortController.signal);
        void loadBookmarks(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, []);

    return (
        <FileBrowserStateProvider itemIds={itemUids}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Shared with me`}</span>}
                toolbar={<SharedWithMeToolbar uids={itemUids} />}
            />
            <SharedWithMe />
        </FileBrowserStateProvider>
    );
};
