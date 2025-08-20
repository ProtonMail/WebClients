import { useModalTwoStatic } from '@proton/components';
import { useDrive } from '@proton/drive/index';

import { withHoc } from '../../hooks/withHoc';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { CreateFolderModalView, type CreateFolderModalViewProps } from './CreateFolderModalView';
import type { CreateFolderModalInnerProps } from './useCreateFolderModalState';
import { type UseCreateFolderModalStateProps, useCreateFolderModalState } from './useCreateFolderModalState';

export const CreateFolderModal = withHoc<UseCreateFolderModalStateProps, CreateFolderModalViewProps>(
    useCreateFolderModalState,
    CreateFolderModalView
);

export const useCreateFolderModal = () => {
    const [modal, showModal] = useModalTwoStatic(CreateFolderModal);
    const { drive } = useDrive();
    const handleShowModal = async ({ onSuccess, ...rest }: CreateFolderModalInnerProps) => {
        const handleSuccess = async ({ uid, nodeId, name }: { uid?: string; nodeId: string; name: string }) => {
            // TODO: Remove this once we can remove legacy CreatFolderModalDeprecated
            // This should never happen as we pass the uid in CreateFolderModal onSuccess action.
            if (!uid) {
                throw new Error('Missing uid in onSuccess callback for create folder modal');
            }
            const { node } = getNodeEntity(await drive.getNode(uid));
            getActionEventManager().emit({
                type: ActionEventName.CREATED_NODES,
                items: [{ uid: node.uid, parentUid: node.parentUid, isShared: node.isShared, isTrashed: false }],
            });
            onSuccess?.({ uid, nodeId, name });
        };
        return showModal({ onSuccess: handleSuccess, ...rest });
    };

    return [modal, handleShowModal] as const;
};
