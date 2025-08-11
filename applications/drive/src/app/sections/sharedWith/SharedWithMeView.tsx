import { useEffect } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useAppTitle } from '@proton/components';
import { DriveEventType, useDrive } from '@proton/drive/index';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { Actions, traceTelemetry } from '../../utils/telemetry';
import { useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';
import SharedWithMe from './SharedWithMe';
import SharedWithMeToolbar from './SharedWithMeToolbar';
import { useBookmarksLoader } from './loaders/useBookmarksLoader';
import { useInvitationsLoader } from './loaders/useInvitationsLoader';
import { useLegacyLoader } from './loaders/useLegacyLoader';
import { useSharedWithMeNodesLoader } from './loaders/useSharedWithMeNodesLoader';

export const SharedWithMeView = () => {
    useAppTitle(c('Title').t`Shared with me`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    const { drive } = useDrive();

    const { loadSharedWithMeNodes } = useSharedWithMeNodesLoader();
    const { loadInvitations } = useInvitationsLoader();
    const { loadBookmarks } = useBookmarksLoader();
    const { loadLegacySharedWithMeAlbums, loadLegacyInvitations } = useLegacyLoader();
    const { itemUids } = useSharedWithMeListingStore(
        useShallow((state) => ({
            itemUids: state.getItemUids(),
        }))
    );

    useEffect(() => {
        setDefaultRoot();
        void traceTelemetry(Actions.SignUpFlowAndRedirectCompleted).end();
    }, []);

    /* Legacy event subscription */
    useEffect(() => {
        const abortController = new AbortController();

        void loadSharedWithMeNodes(abortController.signal);
        void loadInvitations(abortController.signal);
        void loadBookmarks(abortController.signal);
        void loadLegacySharedWithMeAlbums(abortController.signal);
        void loadLegacyInvitations(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, [loadSharedWithMeNodes, loadInvitations, loadBookmarks, loadLegacySharedWithMeAlbums, loadLegacyInvitations]);

    useEffect(() => {
        const abortController = new AbortController();
        const eventSubscriptionPromise = drive.subscribeToDriveEvents(async (event) => {
            if (event.type === DriveEventType.SharedWithMeUpdated) {
                await Promise.all([
                    loadSharedWithMeNodes(abortController.signal),
                    loadInvitations(abortController.signal),
                    loadLegacySharedWithMeAlbums(abortController.signal),
                    loadLegacyInvitations(abortController.signal),
                ]);
            }
        });
        return () => {
            abortController.abort();
            void eventSubscriptionPromise.then((eventSubscription) => eventSubscription.dispose());
        };
    }, [
        drive,
        loadBookmarks,
        loadInvitations,
        loadLegacyInvitations,
        loadLegacySharedWithMeAlbums,
        loadSharedWithMeNodes,
    ]);

    return (
        <FileBrowserStateProvider itemIds={itemUids}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Shared with me`}</span>}
                toolbar={<SharedWithMeToolbar shareId={activeShareId} uids={itemUids} />}
            />
            <SharedWithMe />
        </FileBrowserStateProvider>
    );
};
