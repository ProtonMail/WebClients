import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { MoveItemsModalView, type MoveItemsModalViewProps } from './MoveItemsModalView';
import type { MoveItemsModalInnerProps } from './useMoveItemsModalState';
import { type UseMoveItemsModalStateProps, useMoveItemsModalState } from './useMoveItemsModalState';

const MoveItemsModal = withHoc<UseMoveItemsModalStateProps, MoveItemsModalViewProps>(
    useMoveItemsModalState,
    MoveItemsModalView
);

export const useMoveItemsModal = () => {
    const [moveItemsModal, showMoveToFolderModal] = useModalTwoStatic(MoveItemsModal);

    const showMoveItemsModal = ({ shareId, nodeUids, ...rest }: MoveItemsModalInnerProps) => {
        if (!shareId || !nodeUids.length) {
            return;
        }

        void showMoveToFolderModal({ shareId, nodeUids, ...rest });
    };

    return { moveItemsModal, showMoveItemsModal };
};
