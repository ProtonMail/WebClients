import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';

import { withHoc } from '../modalUtils/withHoc';
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
