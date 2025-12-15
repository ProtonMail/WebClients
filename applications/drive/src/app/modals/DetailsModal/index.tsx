import { useModalTwoStatic } from '@proton/components/index';

import { withHoc } from '../../hooks/withHoc';
import { FileDetailsModalView, type FileDetailsModalViewProps } from './FileDetailsModalView';
import {
    type UseFileDetailsModalProps,
    useDriveFileDetailsModalState,
    usePhotosFileDetailsModalState,
} from './useFileDetailsModalState';

export const FileDetailsModal = withHoc<UseFileDetailsModalProps, FileDetailsModalViewProps>(
    useDriveFileDetailsModalState,
    FileDetailsModalView
);

const PhotosFileDetailsModal = withHoc<UseFileDetailsModalProps, FileDetailsModalViewProps>(
    usePhotosFileDetailsModalState,
    FileDetailsModalView
);

export function useDriveDetailsModal() {
    return useModalTwoStatic(FileDetailsModal);
}

export function usePhotosDetailsModal() {
    return useModalTwoStatic(PhotosFileDetailsModal);
}
