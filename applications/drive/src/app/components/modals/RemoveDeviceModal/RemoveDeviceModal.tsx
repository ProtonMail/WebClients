import React from 'react';

import type { ModalStateProps } from '@proton/components';
import { useModalTwoStatic } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';

import { RemoveDeviceModal } from '../../../modals/RemoveDeviceModal';
import type { Device } from '../../../store';

interface Props {
    onClose?: () => void;
    device: Device;
}

export const useRemoveDeviceModal = () => {
    return useModalTwoStatic(({ device, ...modalProps }: Props & ModalStateProps) => {
        const uid = generateNodeUid(device.volumeId, device.linkId);
        return <RemoveDeviceModal deviceUid={uid} deviceName={device.name} {...modalProps} />;
    });
};
