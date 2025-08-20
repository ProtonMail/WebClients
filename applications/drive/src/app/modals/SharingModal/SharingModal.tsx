import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { SharingModalView, type SharingModalViewProps } from './SharingModalView';
import type { SharingModalInnerProps } from './useSharingModalState';
import { type UseSharingModalProps, useSharingModalState } from './useSharingModalState';

export const SharingModal = withHoc<UseSharingModalProps, SharingModalViewProps>(
    useSharingModalState,
    SharingModalView
);

export const useSharingModal = () => {
    const [linkSharingModal, showLinkSharingModal] = useModalTwoStatic(SharingModal);

    const handleShowLinkSharingModal = ({ onShareChange, ...rest }: SharingModalInnerProps) => {
        const shareChangeCallback = (item: { uid: string; isShared: boolean }) => {
            getActionEventManager().emit({ type: ActionEventName.SHARE_CHANGED_NODES, items: [item] });
            onShareChange?.(item);
        };
        void showLinkSharingModal({ onShareChange: shareChangeCallback, ...rest });
    };

    return [linkSharingModal, handleShowLinkSharingModal] as const;
};
