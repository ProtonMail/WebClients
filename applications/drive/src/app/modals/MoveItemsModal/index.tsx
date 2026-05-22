import { useModalTwoStatic } from '@proton/components';

import { sendErrorReport } from '../../utils/errorHandling';
import { withHoc } from '../modalUtils/withHoc';
import { MoveItemsModalView, type MoveItemsModalViewProps } from './MoveItemsModalView';
import type { MoveItemsModalInnerProps } from './useMoveItemsModalState';
import { type UseMoveItemsModalStateProps, useMoveItemsModalState } from './useMoveItemsModalState';

const MoveItemsModal = withHoc<UseMoveItemsModalStateProps, MoveItemsModalViewProps>(
    useMoveItemsModalState,
    MoveItemsModalView
);

export const useMoveItemsModal = () => {
    const [moveItemsModal, showMoveToFolderModal] = useModalTwoStatic(MoveItemsModal);

    const showMoveItemsModal = ({ nodeUids, ...rest }: MoveItemsModalInnerProps) => {
        if (!nodeUids.length) {
            sendErrorReport(new Error('showMoveItemsModal called with no items selected'));
            return;
        }

        void showMoveToFolderModal({ nodeUids, ...rest });
    };

    return { moveItemsModal, showMoveItemsModal };
};
