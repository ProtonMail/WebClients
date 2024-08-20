import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';

import { useSharedWithMeActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    rootShareId: string;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    close: () => void;
}
export const RemoveMeButton = ({ rootShareId, showConfirmModal, close }: Props) => {
    const { removeMe } = useSharedWithMeActions();

    const handleRemoveMe = () => {
        void showConfirmModal({
            title: c('Title').t`Are you sure you want to leave this share?`,
            message: (
                <>
                    <span className="block">{c('Info').t`You will not be able to join again after.`}</span>
                    <span>{c('Info').t`Only the owner of the share will be able to invite you again.`}</span>
                </>
            ),
            submitText: c('Action').t`Confirm`,
            onSubmit: () => {
                const abortController = new AbortController();
                return removeMe(abortController.signal, rootShareId);
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return (
        <ContextMenuButton
            icon="cross-big"
            name={c('Action').t`Remove me`}
            action={handleRemoveMe}
            close={close}
            testId="shared-with-me-leave"
        />
    );
};
