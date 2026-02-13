import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { CreateFolderModalView, type CreateFolderModalViewProps } from './CreateFolderModalView';
import { type UseCreateFolderModalStateProps, useCreateFolderModalState } from './useCreateFolderModalState';

const CreateFolderModal = withHoc<UseCreateFolderModalStateProps, CreateFolderModalViewProps>(
    useCreateFolderModalState,
    CreateFolderModalView
);

export const useCreateFolderModal = () => {
    const [createFolderModal, showCreateFolderModal] = useModalTwoStatic(CreateFolderModal);
    return { createFolderModal, showCreateFolderModal };
};
