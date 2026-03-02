import { createContext, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { type ShareResult, useDrive } from '@proton/drive';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';

const EditorsManageAccessContext = createContext<{
    editorsManageAccess: boolean;
    changeManageAccess: (canManageAccess: boolean) => Promise<void>;
}>({ editorsManageAccess: false, changeManageAccess: () => Promise.resolve() });

export function EditorsManageAccessContextProvider({
    nodeUid,
    sharingInfo,
    children,
}: {
    nodeUid: string;
    sharingInfo: ShareResult;
    children: React.ReactNode;
}) {
    const { drive } = useDrive();

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
            handleSdkError(error, {
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
