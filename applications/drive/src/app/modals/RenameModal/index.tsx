import { useModalTwoStatic } from '@proton/components';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { withHoc } from '../../hooks/withHoc';
import { RenameModalView, type RenameModalViewProps } from './RenameModalView';
import { type RenameModalInnerProps, type UseRenameModalProps, useRenameModalState } from './useRenameModalState';

export const RenameModal = withHoc<UseRenameModalProps, RenameModalViewProps>(useRenameModalState, RenameModalView);

export const useRenameModal = () => {
    const [renameModal, showRenameModal] = useModalTwoStatic(RenameModal);

    const handleShowRenameModal = ({ onSuccess, nodeUid, drive }: RenameModalInnerProps) => {
        const handleOnSuccess = async (newName: string) => {
            await getBusDriver().emit({
                type: BusDriverEventName.RENAMED_NODES,
                items: [{ uid: nodeUid, newName }],
            });
            await onSuccess?.(newName);
        };
        void showRenameModal({ nodeUid, onSuccess: handleOnSuccess, drive });
    };

    return [renameModal, handleShowRenameModal] as const;
};
