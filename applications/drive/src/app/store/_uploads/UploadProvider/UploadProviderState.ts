import { TransferProgresses } from '../../../components/TransferManager/transfer';
import { UploadFileList } from '../interface';
import { FileUpload, FolderUpload, UpdateFilter } from './interface';

export interface UploadProviderState {
    uploads: (FileUpload | FolderUpload)[];
    hasUploads: boolean;
    uploadFiles: (shareId: string, parentId: string, list: UploadFileList, isForPhotos?: boolean) => Promise<void>;
    pauseUploads: (idOrFilter: UpdateFilter) => void;
    resumeUploads: (idOrFilter: UpdateFilter) => void;
    cancelUploads: (idOrFilter: UpdateFilter) => void;
    restartUploads: (idOrFilter: UpdateFilter) => void;
    removeUploads: (idOrFilter: UpdateFilter) => void;
    clearUploads: () => void;
    getUploadsProgresses: () => TransferProgresses;
    downloadUploadLogs: () => void;
}
