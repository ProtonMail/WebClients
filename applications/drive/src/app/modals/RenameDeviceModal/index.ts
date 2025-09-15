import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { RenameDeviceModalView, type RenameDeviceModalViewProps } from './RenameDeviceModalView';
import type { UseRenameDeviceInnerProps } from './useRenameDeviceModalState';
import { type UseRenameDeviceModalProps, useRenameDeviceModalState } from './useRenameDeviceModalState';

export const RenameDeviceModal = withHoc<UseRenameDeviceModalProps, RenameDeviceModalViewProps>(
    useRenameDeviceModalState,
    RenameDeviceModalView
);

export const useRenameDeviceModal = () => {
    const [renameDeviceModal, showRenameDeviceModal] = useModalTwoStatic(RenameDeviceModal);

    const handleShowRenameModal = ({ onSubmit, ...rest }: UseRenameDeviceInnerProps) => {
        const submitCallback = async (newName: string) => {
            await getActionEventManager().emit({
                type: ActionEventName.RENAMED_DEVICES,
                items: [{ deviceUid: rest.deviceUid, newName }],
            });
            await onSubmit?.(newName);
        };
        showRenameDeviceModal({ onSubmit: submitCallback, ...rest });
    };

    return [renameDeviceModal, handleShowRenameModal] as const;
};
