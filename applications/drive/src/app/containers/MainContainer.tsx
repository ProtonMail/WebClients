import { useEffect, useState } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import {
    LoaderPage,
    LocationErrorBoundary,
    ModalsChildren,
    useLoading,
    useWelcomeFlags,
    useEarlyAccess,
    ReferralModalContainer,
} from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { ENCRYPTED_SEARCH_ENABLED, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import { DriveProvider, useDriveEventManager, useDefaultShare } from '../store';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import TransferManager from '../components/TransferManager/TransferManager';
import ConflictModal from '../components/uploads/ConflictModal';
import DriveWindow from '../components/layout/DriveWindow';
import FolderContainer from './FolderContainer';
import NoAccessContainer from './NoAccessContainer';
import OnboardingContainer from './OnboardingContainer';
import SharedURLsContainer from './SharedLinksContainer';
import TrashContainer from './TrashContainer';
import { SearchIndexingProvider } from '../components/search';
import { SearchContainer } from './SearchContainer';
import { SearchResultsStorageProvider } from '../components/search/SearchResultsStorage';

enum ERROR_TYPES {
    STANDARD,
    NO_ACCESS,
    ONBOARDING,
}

// Empty shared root for blurred container.
const DEFAULT_SHARE_VALUE = {
    shareId: '',
    linkId: '',
};

const InitContainer = () => {
    const { getDefaultShare } = useDefaultShare();
    const [loading, withLoading] = useLoading(true);
    const [defaultShareRoot, setDefaultShareRoot] = useState<{ shareId: string; linkId: string }>(DEFAULT_SHARE_VALUE);
    const [errorType, setErrorType] = useState<ERROR_TYPES>(ERROR_TYPES.STANDARD);
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const earlyAccess = useEarlyAccess();
    const driveEventManager = useDriveEventManager();

    useEffect(() => {
        const initPromise = getDefaultShare()
            .then(({ shareId, rootLinkId: linkId }) => {
                setDefaultShareRoot({ shareId, linkId });
            })
            .catch((error) => {
                if (
                    error?.data?.Code === RESPONSE_CODE.NOT_ALLOWED ||
                    error?.data?.Details?.MissingScopes?.includes('drive')
                ) {
                    return setErrorType(ERROR_TYPES.NO_ACCESS);
                }
                setErrorType(() => {
                    throw error;
                });
            });
        withLoading(initPromise).catch(noop);
    }, []);

    useEffect(() => {
        if (
            defaultShareRoot.linkId === DEFAULT_SHARE_VALUE.linkId ||
            defaultShareRoot.shareId === DEFAULT_SHARE_VALUE.shareId
        ) {
            return;
        }

        driveEventManager.subscribeToShare(defaultShareRoot.shareId).catch(console.warn);
        return () => {
            driveEventManager.unsubscribeFromShare(defaultShareRoot.shareId);
        };
    }, [defaultShareRoot.shareId]);

    if (loading) {
        return (
            <>
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    if (errorType === ERROR_TYPES.NO_ACCESS) {
        return (
            <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
                <NoAccessContainer reason="notpaid" />
            </ActiveShareProvider>
        );
    }

    // user does not have early access.
    if (earlyAccess.value === false) {
        return (
            <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
                <NoAccessContainer reason="notbeta" />
            </ActiveShareProvider>
        );
    }

    if (welcomeFlags.isWelcomeFlow) {
        return (
            <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
                <OnboardingContainer onDone={setWelcomeFlagsDone} />
            </ActiveShareProvider>
        );
    }

    return (
        <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
            <ReferralModalContainer />
            <ModalsChildren />
            <TransferManager />
            <SearchIndexingProvider>
                <SearchResultsStorageProvider>
                    <DriveWindow>
                        <Switch>
                            <Route path="/trash" component={TrashContainer} />
                            <Route path="/shared-urls" component={SharedURLsContainer} />
                            {ENCRYPTED_SEARCH_ENABLED && <Route path="/search" component={SearchContainer} />}
                            <Route path="/:shareId?/:type/:linkId?" component={FolderContainer} />
                            <Redirect to={`/${defaultShareRoot?.shareId}/folder/${defaultShareRoot?.linkId}`} />
                        </Switch>
                    </DriveWindow>
                </SearchResultsStorageProvider>
            </SearchIndexingProvider>
        </ActiveShareProvider>
    );
};

const MainContainer = () => {
    return (
        <LocationErrorBoundary>
            <DriveProvider UploadConflictModal={ConflictModal}>
                <InitContainer />
            </DriveProvider>
        </LocationErrorBoundary>
    );
};

export default MainContainer;
