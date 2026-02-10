import { useModalTwoStatic } from '@proton/components';
import { getDrive } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { withHoc } from '../../hooks/withHoc';
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
    const handleShowModal = async ({ onSuccess, drive = getDrive(), ...rest }: CreateFolderModalInnerProps) => {
        const handleSuccess = async ({ uid, nodeId, name }: { uid?: string; nodeId: string; name: string }) => {
            // TODO: Remove this once we can remove legacy CreatFolderModalDeprecated
            // This should never happen as we pass the uid in CreateFolderModal onSuccess action.
            if (!uid) {
                throw new Error('Missing uid in onSuccess callback for create folder modal');
            }
            const { node } = getNodeEntity(await drive.getNode(uid));
            await getBusDriver().emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: node.uid, parentUid: node.parentUid, isShared: node.isShared, isTrashed: false }],
            });
            onSuccess?.({ uid, nodeId, name });
        };
        return showModal({ onSuccess: handleSuccess, drive, ...rest });
    };

    return [modal, handleShowModal] as const;
};
