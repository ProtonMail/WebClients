import { useModalTwoStatic } from '@proton/components';
import { BusDriverEventName, type NodeEventMeta, getBusDriver } from '@proton/drive/internal/BusDriver';

import { withHoc } from '../../hooks/withHoc';
import { MoveItemsModalView, type MoveItemsModalViewProps } from './MoveItemsModalView';
import type { MoveItemsModalInnerProps } from './useMoveItemsModalState';
import { type UseMoveItemsModalStateProps, useMoveItemsModalState } from './useMoveItemsModalState';

export const MoveItemsModal = withHoc<UseMoveItemsModalStateProps, MoveItemsModalViewProps>(
    useMoveItemsModalState,
    MoveItemsModalView
);

export const useMoveItemsModal = () => {
    const [moveToFolderModal, showMoveToFolderModal] = useModalTwoStatic(MoveItemsModal);

    const handleShowMoveToFolderModal = ({ shareId, selectedItems, onSuccess, ...rest }: MoveItemsModalInnerProps) => {
        if (!shareId || !selectedItems.length) {
            return;
        }
        const successCallback = async (items: NodeEventMeta[]) => {
            await getBusDriver().emit({ type: BusDriverEventName.MOVED_NODES, items });
            onSuccess?.(items);
        };
        void showMoveToFolderModal({ shareId, selectedItems, onSuccess: successCallback, ...rest });
    };

    return [moveToFolderModal, handleShowMoveToFolderModal] as const;
};
