import { useMemo } from 'react';

import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { buildTreeview } from '@proton/shared/lib/helpers/folder';

import { folderReducer } from './helpers';
import type { FolderItem } from './interface';

export const useMailFolderTreeView = () => {
    const [folders = [], loadingFolders] = useFolders();
    const [mailSettings, loadingMailSettings] = useMailSettings();

    const list = useMemo(() => {
        return buildTreeview(folders).reduce<FolderItem[]>(
            (acc, folder) => folderReducer({ acc, folder, folders, mailSettings, level: 0 }),
            []
        );
    }, [folders, mailSettings]);

    return { list, loading: loadingFolders || loadingMailSettings };
};
