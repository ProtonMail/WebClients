import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { RenameModalView, type RenameModalViewProps } from './RenameModalView';
import { type RenameModalInnerProps, type UseRenameModalProps, useRenameModalState } from './useRenameModalState';

export const RenameModal = withHoc<UseRenameModalProps, RenameModalViewProps>(useRenameModalState, RenameModalView);

export const useRenameModal = () => {
    const [renameModal, showRenameModal] = useModalTwoStatic(RenameModal);

    const handleShowRenameModal = ({ onSuccess, nodeUid }: RenameModalInnerProps) => {
        const handleOnSuccess = async (newName: string) => {
            await getActionEventManager().emit({
                type: ActionEventName.RENAMED_NODES,
                items: [{ uid: nodeUid, newName }],
            });
            await onSuccess?.(newName);
        };
        void showRenameModal({ nodeUid, onSuccess: handleOnSuccess });
    };

    return [renameModal, handleShowRenameModal] as const;
};
