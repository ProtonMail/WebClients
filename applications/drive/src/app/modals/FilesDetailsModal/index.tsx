import { useModalTwoStatic } from '@proton/components/index';

import { withHoc } from '../../hooks/withHoc';
import { FilesDetailsModalView, type FilesDetailsModalViewProps } from './FilesDetailsModalView';
import { type UseFilesDetailsModalProps, useFilesDetailsModalState } from './useFilesDetailsModalState';

const FilesDetailsModal = withHoc<UseFilesDetailsModalProps, FilesDetailsModalViewProps>(
    useFilesDetailsModalState,
    FilesDetailsModalView
);

export function useFilesDetailsModal() {
    const [filesDetailsModal, showFilesDetailsModal] = useModalTwoStatic(FilesDetailsModal);
    return { filesDetailsModal, showFilesDetailsModal };
}
