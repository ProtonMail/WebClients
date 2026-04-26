import { createContext, useContext, useEffect, useState } from 'react';

import type { ProtonDriveClient, ShareResult } from '@protontech/drive-sdk';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';

import { handleDriveError } from '../../../internal/handleDriveError';

const EditorsManageAccessContext = createContext<{
    editorsManageAccess: boolean;
    changeManageAccess: (canManageAccess: boolean) => Promise<void>;
}>({ editorsManageAccess: false, changeManageAccess: () => Promise.resolve() });

export function EditorsManageAccessContextProvider({
    nodeUid,
    sharingInfo,
    drive,
    children,
}: {
    nodeUid: string;
    sharingInfo: ShareResult;
    drive: Pick<ProtonDriveClient, 'shareNode'>;
    children: React.ReactNode;
}) {
    const { createNotification } = useNotifications();

    const [editorsManageAccess, setEditorsManageAccess] = useState(false);
    useEffect(() => {
        setEditorsManageAccess(sharingInfo.editorsCanShare);
    }, [sharingInfo]);

    async function changeManageAccess(editorsCanShare: boolean) {
        try {
            await drive.shareNode(nodeUid, {
                editorsCanShare,
            });

            setEditorsManageAccess(editorsCanShare);

            if (editorsCanShare) {
                createNotification({
                    text: c('Notification').t`Setting updated. Editors can change permissions and share.`,
                    showCloseButton: false,
                });
            } else {
                createNotification({
                    text: c('Notification').t`Setting updated. Editors can't change permissions or share.`,
                    showCloseButton: false,
                });
            }
        } catch (error) {
            handleDriveError(error, {
                fallbackMessage: c('Error').t`Failed to change permissions settings`,
                extra: { nodeUid },
            });
        }
    }

    return (
        <EditorsManageAccessContext.Provider value={{ editorsManageAccess, changeManageAccess }}>
            {children}
        </EditorsManageAccessContext.Provider>
    );
}

export function useEditorsManageAccessContext() {
    return useContext(EditorsManageAccessContext);
}
