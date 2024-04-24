import { DocumentShell } from './lib/_documents/DocumentShell';
import useDocuments from './lib/_documents/useDocuments';
import { useShareByVolume } from './lib/_shares/useShareByVolume';
import { UserSettingsProvider, useActions, useDefaultShare, useFileView } from './store';
import { DevicesProvider } from './store/_devices';
import { DownloadsProvider } from './store/_downloads';
import { DriveEventManagerProvider } from './store/_events';
import { LinksProvider, useLink } from './store/_links';
import { DecryptedLink } from './store/_links/interface';
import { SearchProvider } from './store/_search';
import { SharesProvider } from './store/_shares';
import { UploadProvider } from './store/_uploads';
import { useAbortSignal } from './store/_views/utils';
import { useVolumesState } from './store/_volumes';
import { VolumesProvider } from './store/_volumes';
import { sendErrorReport } from './utils/errorHandling';
import { EnrichedError } from './utils/errorHandling/EnrichedError';
import { getRefreshError } from './utils/errorHandling/RefreshError';

const useDriveView = () => {
    const abortSignal = useAbortSignal([]);
    const { getShareByVolume } = useShareByVolume();
    const { getLinkSessionKey, getLink } = useLink();
    const { getDefaultShare } = useDefaultShare();
    const { createDocumentShell } = useDocuments();
    const { renameLink } = useActions();
    const { findVolumeId } = useVolumesState();

    return {
        abortSignal,
        createDocumentShell,
        findVolumeId,
        getDefaultShare,
        getLink,
        getLinkSessionKey,
        getShareByVolume,
        renameLink,
        useFileView,
    };
};

type DriveStore = ReturnType<typeof useDriveView>;

export {
    type DecryptedLink,
    type DocumentShell,
    DevicesProvider,
    DownloadsProvider,
    DriveEventManagerProvider,
    DriveStore,
    EnrichedError,
    getRefreshError,
    LinksProvider,
    SearchProvider,
    sendErrorReport,
    SharesProvider,
    UploadProvider,
    useDriveView,
    UserSettingsProvider,
    VolumesProvider,
};
