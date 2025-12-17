import { useModalTwoStatic } from '@proton/components/index';

import { withHoc } from '../../hooks/withHoc';
import { FileDetailsModalView, type FileDetailsModalViewProps } from './FileDetailsModalView';
import { type UseFileDetailsModalProps, useFileDetailsModalState } from './useFileDetailsModalState';

export const DetailsModal = withHoc<UseFileDetailsModalProps, FileDetailsModalViewProps>(
    useFileDetailsModalState,
    FileDetailsModalView
);

export function useDetailsModal() {
    return useModalTwoStatic(DetailsModal);
}
