import { withHoc } from '../../hooks/withHoc';
import { CreateFolderModalView, type CreateFolderModalViewProps } from './CreateFolderModalView';
import { type UseCreateFolderModalStateProps, useCreateFolderModalState } from './useCreateFolderModalState';

export const CreateFolderModal = withHoc<UseCreateFolderModalStateProps, CreateFolderModalViewProps>(
    useCreateFolderModalState,
    CreateFolderModalView
);
