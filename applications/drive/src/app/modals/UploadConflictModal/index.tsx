import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../modalUtils/withHoc';
import { UploadConflictModalView, type UploadConflictModalViewProps } from './UploadConflictModalView';
import { type UseUploadConflictModalProps, useUploadConflictModalState } from './useUploadConflictModalState';

const UploadConflictModal = withHoc<UseUploadConflictModalProps, UploadConflictModalViewProps>(
    useUploadConflictModalState,
    UploadConflictModalView
);

export const useUploadConflictModal = () => useModalTwoStatic(UploadConflictModal);
