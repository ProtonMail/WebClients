import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { RenameDeviceModalView, type RenameDeviceModalViewProps } from './RenameDeviceModalView';
import { type UseRenameDeviceModalProps, useRenameDeviceModalState } from './useRenameDeviceModalState';

const RenameDeviceModal = withHoc<UseRenameDeviceModalProps, RenameDeviceModalViewProps>(
    useRenameDeviceModalState,
    RenameDeviceModalView
);

export const useRenameDeviceModal = () => {
    const [renameDeviceModal, showRenameDeviceModal] = useModalTwoStatic(RenameDeviceModal);
    return { renameDeviceModal, showRenameDeviceModal };
};
