import { createContext, useContext } from 'react';
import * as React from 'react';

import { TransferProgresses } from '../../../components/TransferManager/transfer';
import { InitDownloadCallback, LinkDownload } from '../interface';
import { Download, DownloadLinksProgresses, UpdateFilter } from './interface';
import useDownload from './useDownloadProvider';

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
    initDownload,
    children,
}: {
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
        downloadIsTooBigModal,
        signatureIssueModal,
    } = useDownload(initDownload);

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
            {downloadIsTooBigModal}
            {signatureIssueModal}
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
