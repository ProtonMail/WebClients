import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { RemoveDeviceModalView, type RemoveDeviceModalViewProps } from './RemoveDeviceModalView';
import type { UseRemoveDeviceInnerProps } from './useRemoveDeviceModalState';
import { type UseRemoveDeviceModalProps, useRemoveDeviceModalState } from './useRemoveDeviceModalState';

export const RemoveDeviceModal = withHoc<UseRemoveDeviceModalProps, RemoveDeviceModalViewProps>(
    useRemoveDeviceModalState,
    RemoveDeviceModalView
);

export const useRemoveDeviceModal = () => {
    const [removeDeviceModal, showRemoveDeviceModal] = useModalTwoStatic(RemoveDeviceModal);

    const handleShowRemoveModal = ({ onSubmit, ...rest }: UseRemoveDeviceInnerProps) => {
        const submitCallback = async () => {
            await getActionEventManager().emit({ type: ActionEventName.REMOVED_DEVICES, deviceUids: [rest.deviceUid] });
            await onSubmit?.();
        };
        showRemoveDeviceModal({ onSubmit: submitCallback, ...rest });
    };

    return [removeDeviceModal, handleShowRemoveModal] as const;
};
