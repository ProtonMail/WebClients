import type { IconComponent } from '@proton/icons/component';
import type { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

export type FolderItem = Folder & {
    icon: IconComponent;
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
