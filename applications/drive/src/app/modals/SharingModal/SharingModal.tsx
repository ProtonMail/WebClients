import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { SharingModalView, type SharingModalViewProps } from './SharingModalView';
import { type UseSharingModalProps, useSharingModalState } from './useSharingModalState';

const SharingModal = withHoc<UseSharingModalProps, SharingModalViewProps>(useSharingModalState, SharingModalView);

export const useSharingModal = () => {
    const [sharingModal, showSharingModal] = useModalTwoStatic(SharingModal);
    return { sharingModal, showSharingModal };
};
