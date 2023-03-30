import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

export interface RevisionsProviderState {
    openRevisionPreview: (revision: DriveFileRevision) => void;
    downloadRevision: (revision: DriveFileRevision) => void;
    havePreviewAvailable: boolean;
}
