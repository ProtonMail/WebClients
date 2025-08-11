import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Icon, ToolbarButton } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useSharedWithMeActions } from '../../../hooks/drive/useSharedWithMeActions';
import { useSharedWithMeActions as useLegacySharedWithMeActions } from '../../../store';
import { useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

interface BaseProps {
    nodeUid: string;
    shareId: string;
    isAlbum: boolean;
}

interface ContextMenuProps extends BaseProps {
    type: 'contextMenu';
    close: () => void;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ToolbarProps extends BaseProps {
    type: 'toolbar';
    close?: never;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

type Props = ContextMenuProps | ToolbarProps;

export const RemoveMeButton = ({ nodeUid, shareId, isAlbum, showConfirmModal, close, type }: Props) => {
    const { removeMe } = useSharedWithMeActions();
    const { removeMe: legacyRemoveMe } = useLegacySharedWithMeActions();
    const removeSharedWithMeItemFromStore = useSharedWithMeListingStore(
        useShallow((state) => state.removeSharedWithMeItem)
    );

    const handleRemoveMe = () => {
        if (isAlbum) {
            legacyRemoveMe(new AbortController().signal, showConfirmModal, shareId, () => {
                removeSharedWithMeItemFromStore(nodeUid);
            });
        } else {
            removeMe(showConfirmModal, nodeUid, removeSharedWithMeItemFromStore);
        }
    };

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Remove me`}
                icon={<Icon name="cross-big" alt={c('Action').t`Remove me`} />}
                onClick={handleRemoveMe}
                data-testid="toolbar-shared-with-me-leave"
            />
        );
    }

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
