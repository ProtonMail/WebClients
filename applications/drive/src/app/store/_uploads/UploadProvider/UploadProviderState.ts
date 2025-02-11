import type { TransferProgresses } from '../../../components/TransferManager/transfer';
import type { OnFileUploadSuccessCallbackData, OnFolderUploadSuccessCallbackData, UploadFileList } from '../interface';
import type { FileUpload, FolderUpload, UpdateFilter } from './interface';

export interface UploadProviderState {
    uploads: (FileUpload | FolderUpload)[];
    hasUploads: boolean;
    uploadFiles: (
        shareId: string,
        parentId: string,
        list: UploadFileList,
        isForPhotos?: boolean,
        onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void,
        onFolderUpload?: (folder: OnFolderUploadSuccessCallbackData) => void
    ) => Promise<void>;
    pauseUploads: (idOrFilter: UpdateFilter) => void;
    resumeUploads: (idOrFilter: UpdateFilter) => void;
    cancelUploads: (idOrFilter: UpdateFilter) => void;
    restartUploads: (idOrFilter: UpdateFilter) => void;
    removeUploads: (idOrFilter: UpdateFilter) => void;
    clearUploads: () => void;
    getUploadsProgresses: () => TransferProgresses;
    downloadUploadLogs: () => void;
}
