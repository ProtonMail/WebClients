import { useModalTwoStatic } from '@proton/components/index';

import { withHoc } from '../../hooks/withHoc';
import { FileDetailsModalView, type FileDetailsModalViewProps } from './FileDetailsModalView';
import { type UseFileDetailsModalProps, useFileDetailsModalState } from './useFileDetailsModalState';

const DetailsModal = withHoc<UseFileDetailsModalProps, FileDetailsModalViewProps>(
    useFileDetailsModalState,
    FileDetailsModalView
);

export function useDetailsModal() {
    const [detailsModal, showDetailsModal] = useModalTwoStatic(DetailsModal);
    return { detailsModal, showDetailsModal };
}
