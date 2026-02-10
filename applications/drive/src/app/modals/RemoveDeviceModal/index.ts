import { useModalTwoStatic } from '@proton/components';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { withHoc } from '../../hooks/withHoc';
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
            await getBusDriver().emit({ type: BusDriverEventName.REMOVED_DEVICES, deviceUids: [rest.deviceUid] });
            await onSubmit?.();
        };
        showRemoveDeviceModal({ onSubmit: submitCallback, ...rest });
    };

    return [removeDeviceModal, handleShowRemoveModal] as const;
};
