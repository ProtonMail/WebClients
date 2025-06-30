import { withHoc } from '../../hooks/withHoc';
import { SharingModalView, type SharingModalViewProps } from './SharingModalView';
import { type UseSharingModalProps, useSharingModalState } from './useSharingModalState';

export const SharingModal = withHoc<UseSharingModalProps, SharingModalViewProps>(
    useSharingModalState,
    SharingModalView
);
