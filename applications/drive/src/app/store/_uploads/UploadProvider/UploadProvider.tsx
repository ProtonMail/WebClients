import { ReactNode, createContext, useContext } from 'react';

import { TransferProgresses } from '../../../components/TransferManager/transfer';
import { UploadFileList } from '../interface';
import { FileUpload, FolderUpload, UpdateFilter } from './interface';
import useUpload from './useUpload';

interface UploadProviderState {
    uploads: (FileUpload | FolderUpload)[];
    hasUploads: boolean;
    uploadFiles: (shareId: string, parentId: string, list: UploadFileList) => Promise<void>;
    pauseUploads: (idOrFilter: UpdateFilter) => void;
    resumeUploads: (idOrFilter: UpdateFilter) => void;
    cancelUploads: (idOrFilter: UpdateFilter) => void;
    restartUploads: (idOrFilter: UpdateFilter) => void;
    removeUploads: (idOrFilter: UpdateFilter) => void;
    clearUploads: () => void;
    getUploadsProgresses: () => TransferProgresses;
}

const UploadContext = createContext<UploadProviderState | null>(null);

/**
 * @private please use TextAreaTwo instead
 */
export const UploadProvider = ({ children }: { children: ReactNode }) => {
    const {
        uploads,
        hasUploads,
        uploadFiles,
        getProgresses,
        pauseUploads,
        resumeUploads,
        cancelUploads,
        restartUploads,
        removeUploads,
        clearUploads,
        conflictModal,
        fileThresholdModal,
    } = useUpload();

    return (
        <UploadContext.Provider
            value={{
                uploads,
                hasUploads,
                uploadFiles,
                pauseUploads,
                resumeUploads,
                cancelUploads,
                restartUploads,
                removeUploads,
                clearUploads,
                getUploadsProgresses: getProgresses,
            }}
        >
            {children}
            {conflictModal}
            {fileThresholdModal}
        </UploadContext.Provider>
    );
};

export const useUploadProvider = (): UploadProviderState => {
    const state = useContext(UploadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized UploadProvider');
    }
    return state;
};
