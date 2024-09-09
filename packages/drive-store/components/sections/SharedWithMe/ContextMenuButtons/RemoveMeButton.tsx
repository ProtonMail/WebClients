import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components/components';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    rootShareId: string;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    removeMe: (
        abortSignal: AbortSignal,
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        shareId: string
    ) => void;
    close: () => void;
}
export const RemoveMeButton = ({ rootShareId, showConfirmModal, removeMe, close }: Props) => {
    return (
        <ContextMenuButton
            icon="cross-big"
            name={c('Action').t`Remove me`}
            action={() => removeMe(new AbortController().signal, showConfirmModal, rootShareId)}
            close={close}
            testId="shared-with-me-leave"
        />
    );
};
