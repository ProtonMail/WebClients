import { withHoc } from '../../hooks/withHoc';
import { FileDetailsModalView, type FileDetailsModalViewProps } from './FileDetailsModalView';
import { type UseFileDetailsModalProps, useFileDetailsModalState } from './useFileDetailsModalState';

export const FileDetailsModal = withHoc<UseFileDetailsModalProps, FileDetailsModalViewProps>(
    useFileDetailsModalState,
    FileDetailsModalView
);
