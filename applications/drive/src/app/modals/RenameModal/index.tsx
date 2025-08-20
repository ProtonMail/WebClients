import { useModalTwoStatic } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';

import { withHoc } from '../../hooks/withHoc';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { RenameModalView, type RenameModalViewProps } from './RenameModalView';
import { type RenameModalInnerProps, type UseRenameModalProps, useRenameModalState } from './useRenameModalState';

export const RenameModal = withHoc<UseRenameModalProps, RenameModalViewProps>(useRenameModalState, RenameModalView);

export const useRenameModal = () => {
    const [renameModal, showRenameModal] = useModalTwoStatic(RenameModal);

    const handleShowRenameModal = ({ onSubmit, ...rest }: RenameModalInnerProps) => {
        const submitCallback = async (newName: string) => {
            const uid = generateNodeUid(rest.volumeId, rest.linkId);
            getActionEventManager().emit({ type: ActionEventName.RENAMED_NODES, items: [{ uid, newName }] });
            await onSubmit?.(newName);
        };
        void showRenameModal({ onSubmit: submitCallback, ...rest });
    };

    return [renameModal, handleShowRenameModal] as const;
};
