import { createContext, useContext } from 'react';
import * as React from 'react';

import { TransferProgresses } from '@proton/shared/lib/interfaces/drive/transfer';

import { LinkDownload, DownloadSignatureIssueModal } from '../interface';
import { Download, UpdateFilter } from './interface';
import useDownload from './useDownloadProvider';

interface DownloadProviderState {
    downloads: Download[];
    hasDownloads: boolean;
    download: (links: LinkDownload[]) => Promise<void>;
    pauseDownloads: (idOrFilter: UpdateFilter) => void;
    resumeDownloads: (idOrFilter: UpdateFilter) => void;
    cancelDownloads: (idOrFilter: UpdateFilter) => void;
    restartDownloads: (idOrFilter: UpdateFilter) => void;
    removeDownloads: (idOrFilter: UpdateFilter) => void;
    clearDownloads: () => void;
    getDownloadsProgresses: () => TransferProgresses;
}

const DownloadContext = createContext<DownloadProviderState | null>(null);

export const DownloadProvider = ({
    DownloadSignatureIssueModal,
    children,
}: {
    DownloadSignatureIssueModal: DownloadSignatureIssueModal;
    children: React.ReactNode;
}) => {
    const {
        downloads,
        hasDownloads,
        download,
        getProgresses,
        pauseDownloads,
        resumeDownloads,
        cancelDownloads,
        restartDownloads,
        removeDownloads,
        clearDownloads,
    } = useDownload(DownloadSignatureIssueModal);

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
                getDownloadsProgresses: getProgresses,
            }}
        >
            {children}
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
