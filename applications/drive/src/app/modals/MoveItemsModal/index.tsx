import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import type { NodeEventMeta } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
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
        const successCallback = (items: NodeEventMeta[]) => {
            getActionEventManager().emit({ type: ActionEventName.MOVED_NODES, items });
            onSuccess?.(items);
        };
        void showMoveToFolderModal({ shareId, selectedItems, onSuccess: successCallback, ...rest });
    };

    return [moveToFolderModal, handleShowMoveToFolderModal] as const;
};
