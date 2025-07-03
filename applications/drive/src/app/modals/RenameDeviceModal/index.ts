import { withHoc } from '../../hooks/withHoc';
import { RenameDeviceModalView, type RenameDeviceModalViewProps } from './RenameDeviceModalView';
import { type UseRenameDeviceModalProps, useRenameDeviceModalState } from './useRenameDeviceModalState';

export const RenameDeviceModal = withHoc<UseRenameDeviceModalProps, RenameDeviceModalViewProps>(
    useRenameDeviceModalState,
    RenameDeviceModalView
);
