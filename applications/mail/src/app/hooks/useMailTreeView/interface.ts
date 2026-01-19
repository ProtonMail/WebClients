import type { IconName } from '@proton/icons/types';
import type { Folder, FolderWithSubFolders, MailSettings } from '@proton/shared/lib/interfaces';

export type FolderItem = Folder & {
    icon: IconName;
    level: number;
    color?: string | undefined;
    folderIconProps?: {
        className?: string;
        color?: string;
    };
};

export interface FolderColorProps {
    folders: FolderWithSubFolders[];
    folder: FolderWithSubFolders;
    mailSettings?: MailSettings;
}

export interface FolderReducerProps extends FolderColorProps {
    acc: FolderItem[];
    level: number;
}
