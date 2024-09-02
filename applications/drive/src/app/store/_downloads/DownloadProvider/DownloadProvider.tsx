import { createContext, useContext } from 'react';
import * as React from 'react';

import type { UserModel } from '@proton/shared/lib/interfaces';

import type { TransferProgresses } from '../../../components/TransferManager/transfer';
import type { InitDownloadCallback, LinkDownload } from '../interface';
import type { Download, DownloadLinksProgresses, UpdateFilter } from './interface';
import downloadProvider from './useDownloadProvider';

interface DownloadProviderState {
    downloads: Download[];
    hasDownloads: boolean;
    download: (links: LinkDownload[], options?: { virusScan?: boolean }) => Promise<void>;
    pauseDownloads: (idOrFilter: UpdateFilter) => void;
    resumeDownloads: (idOrFilter: UpdateFilter) => void;
    cancelDownloads: (idOrFilter: UpdateFilter) => void;
    restartDownloads: (idOrFilter: UpdateFilter) => void;
    removeDownloads: (idOrFilter: UpdateFilter) => void;
    clearDownloads: () => void;
    downloadDownloadLogs: () => void;
    getDownloadsProgresses: () => TransferProgresses;
    getDownloadsLinksProgresses: () => DownloadLinksProgresses;
}

const DownloadContext = createContext<DownloadProviderState | null>(null);

export const DownloadProvider = ({
    user,
    initDownload,
    children,
}: {
    user: UserModel | undefined;
    initDownload: InitDownloadCallback;
    children: React.ReactNode;
}) => {
    const {
        downloads,
        hasDownloads,
        download,
        getProgresses,
        getLinksProgress,
        pauseDownloads,
        resumeDownloads,
        cancelDownloads,
        restartDownloads,
        removeDownloads,
        clearDownloads,
        downloadDownloadLogs,
        modals,
    } = downloadProvider(user, initDownload);

    return (
        <DownloadContext.Provider
            value={{
                downloads,
                hasDownloads,
                download,
                pauseDownloads,
                resumeDownloads,
                cancelDownloads,
                restartDownloads,
                removeDownloads,
                clearDownloads,
                downloadDownloadLogs,
                getDownloadsProgresses: getProgresses,
                getDownloadsLinksProgresses: getLinksProgress,
            }}
        >
            {children}
            {modals}
        </DownloadContext.Provider>
    );
};

export const useDownloadProvider = (): DownloadProviderState => {
    const state = useContext(DownloadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DownloadProvider');
    }
    return state;
};
