import { withHoc } from '../../hooks/withHoc';
import { RenameModalView, type RenameModalViewProps } from './RenameModalView';
import { type UseRenameModalProps, useRenameModalState } from './useRenameModalState';

export const RenameModal = withHoc<UseRenameModalProps, RenameModalViewProps>(useRenameModalState, RenameModalView);
