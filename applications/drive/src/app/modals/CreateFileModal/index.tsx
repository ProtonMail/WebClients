import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { CreateFileModalView, type CreateFileModalViewProps } from './CreateFileModalView';
import { type UseCreateFileModalStateProps, useCreateFileModalState } from './useCreateFileModalState';

const CreateFileModal = withHoc<UseCreateFileModalStateProps, CreateFileModalViewProps>(
    useCreateFileModalState,
    CreateFileModalView
);

export const useCreateFileModal = () => {
    const [createFileModal, showCreateFileModal] = useModalTwoStatic(CreateFileModal);
    return { createFileModal, showCreateFileModal };
};
