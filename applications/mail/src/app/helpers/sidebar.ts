import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';

import { UnreadCounts } from '../components/sidebar/MailSidebarList';

export const getUnreadCount = (counterMap: UnreadCounts, folder: FolderWithSubFolders): number => {
    if (folder.Expanded) {
        return counterMap[folder.ID] || 0;
    }
    return (folder?.subfolders || []).reduce(
        (acc, fold) => acc + getUnreadCount(counterMap, { ...fold, Expanded: 0 }), // force Expanded to 0 to count all sub folders
        counterMap[folder.ID] || 0
    );
};
