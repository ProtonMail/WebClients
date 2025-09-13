import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { SharingModalView, type SharingModalViewProps } from './SharingModalView';
import { type UseSharingModalProps, useSharingModalState } from './useSharingModalState';

export const SharingModal = withHoc<UseSharingModalProps, SharingModalViewProps>(
    useSharingModalState,
    SharingModalView
);

export const useSharingModal = () => {
    const [linkSharingModal, showLinkSharingModal] = useModalTwoStatic(SharingModal);

    return [linkSharingModal, showLinkSharingModal] as const;
};
