import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { RenameModalView, type RenameModalViewProps } from './RenameModalView';
import { type UseRenameModalProps, useRenameModalState } from './useRenameModalState';

const RenameModal = withHoc<UseRenameModalProps, RenameModalViewProps>(useRenameModalState, RenameModalView);

export const useRenameModal = () => {
    const [renameModal, showRenameModal] = useModalTwoStatic(RenameModal);
    return { renameModal, showRenameModal };
};
