import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { RemoveDeviceModalView, type RemoveDeviceModalViewProps } from './RemoveDeviceModalView';
import { type UseRemoveDeviceModalProps, useRemoveDeviceModalState } from './useRemoveDeviceModalState';

const RemoveDeviceModal = withHoc<UseRemoveDeviceModalProps, RemoveDeviceModalViewProps>(
    useRemoveDeviceModalState,
    RemoveDeviceModalView
);

export const useRemoveDeviceModal = () => {
    const [removeDeviceModal, showRemoveDeviceModal] = useModalTwoStatic(RemoveDeviceModal);
    return { removeDeviceModal, showRemoveDeviceModal };
};
