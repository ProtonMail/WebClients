import { withHoc } from '../../hooks/withHoc';
import { MoveItemsModalView, type MoveItemsModalViewProps } from './MoveItemsModalView';
import { type UseMoveItemsModalStateProps, useMoveItemsModalState } from './useMoveItemsModalState';

export const MoveItemsModal = withHoc<UseMoveItemsModalStateProps, MoveItemsModalViewProps>(
    useMoveItemsModalState,
    MoveItemsModalView
);
