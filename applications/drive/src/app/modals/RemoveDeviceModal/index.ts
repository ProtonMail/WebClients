import { withHoc } from '../../hooks/withHoc';
import { RemoveDeviceModalView, type RemoveDeviceModalViewProps } from './RemoveDeviceModalView';
import { type UseRemoveDeviceModalProps, useRemoveDeviceModalState } from './useRemoveDeviceModalState';

export const RemoveDeviceModal = withHoc<UseRemoveDeviceModalProps, RemoveDeviceModalViewProps>(
    useRemoveDeviceModalState,
    RemoveDeviceModalView
);
