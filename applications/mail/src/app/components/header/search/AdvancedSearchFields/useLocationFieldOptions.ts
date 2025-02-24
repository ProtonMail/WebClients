import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail';
import { getStandardFolders } from '@proton/mail/labels/helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import useMailModel from 'proton-mail/hooks/useMailModel';

import useScheduleSendFeature from '../../../composer/actions/scheduleSend/useScheduleSendFeature';

interface ItemBase {
    text: string;
    value: string;
}

export interface ItemDefaultFolder extends ItemBase {
    icon: IconName;
    url: string;
}

export interface ItemCustomFolder extends ItemBase {
    folderEntity: FolderWithSubFolders;
    className: string;
}

export interface ItemLabel extends ItemBase {
    color: string;
    url: string;
}

export type Item = ItemCustomFolder | ItemDefaultFolder | ItemLabel;

type ItemType = 'DEFAULT_FOLDERS' | 'CUSTOM_FOLDERS' | 'LABELS';
interface ItemGroup<T = Item> {
    id: ItemType;
    title: string;
    items: T[];
}

export type ItemsGroup = [ItemGroup<ItemDefaultFolder>, ItemGroup<ItemCustomFolder>, ItemGroup<ItemLabel>];

interface UseLocationFieldOptionsReturn {
    all: Item[];
    grouped: ItemsGroup;
    findItemByValue: (value: string) => Item | undefined;
    isDefaultFolder(item: Item): item is ItemDefaultFolder;
    isCustomFolder(item: Item): item is ItemCustomFolder;
    isLabel(item: Item): item is ItemLabel;
}

const {
    INBOX,
    TRASH,
    SPAM,
    STARRED,
    ARCHIVE,
    ALL_MAIL,
    ALMOST_ALL_MAIL,
    ALL_SENT,
    SENT,
    ALL_DRAFTS,
    DRAFTS,
    SCHEDULED,
    SNOOZED,
} = MAILBOX_LABEL_IDS;

const getMarginByFolderLvl = (lvl: number) => {
    switch (lvl) {
        case 1:
            return 'ml-2';
        case 2:
        case 3:
        case 4:
            return 'ml-4';
        default:
            return '';
    }
};

function folderReducer(acc: ItemCustomFolder[], folder: FolderWithSubFolders, level = 0) {
    acc.push({
        text: formatFolderName(level, folder.Name),
        value: folder.ID,
        className: getMarginByFolderLvl(level),
        folderEntity: folder,
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => folderReducer(acc, folder, level + 1));
    }

    return acc;
}

const buildFolderOption = (folderMap: ReturnType<typeof getStandardFolders>, folderID: MAILBOX_LABEL_IDS) => ({
    value: folderID,
    text: folderMap[folderID].name,
    url: folderMap[folderID].to,
    icon: folderMap[folderID].icon,
});

export function useLocationFieldOptions(): UseLocationFieldOptionsReturn {
    const mailSettings = useMailModel('MailSettings');
    const [labels = []] = useLabels();
    const [folders] = useFolders();
    const treeview = buildTreeview(folders);
    const { canScheduleSend } = useScheduleSendFeature();

    const DRAFT_TYPE = hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS;
    const SENT_TYPE = hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT) ? ALL_SENT : SENT;
    const { AlmostAllMail } = mailSettings;
    const folderMap = getStandardFolders();
    const defaultFolders: ItemDefaultFolder[] = [
        buildFolderOption(folderMap, AlmostAllMail ? ALMOST_ALL_MAIL : ALL_MAIL),
        buildFolderOption(folderMap, INBOX),
        buildFolderOption(folderMap, SNOOZED),
        buildFolderOption(folderMap, DRAFT_TYPE),
        ...(canScheduleSend
            ? [buildFolderOption(folderMap, SCHEDULED)]
            : []),
        buildFolderOption(folderMap, SENT_TYPE),
        buildFolderOption(folderMap, STARRED),
        buildFolderOption(folderMap, ARCHIVE),
        buildFolderOption(folderMap, SPAM),
        buildFolderOption(folderMap, TRASH),
    ];

    const customFolders: ItemCustomFolder[] = treeview.reduce(
        (acc: ItemCustomFolder[], folder) => folderReducer(acc, folder),
        []
    );

    const labelOptions: ItemLabel[] = labels.map<ItemLabel>(({ ID: value, Name: text, Color: color }) => ({
        value,
        text,
        url: value,
        color,
    }));

    const all = [...defaultFolders, ...customFolders, ...labelOptions];

    return {
        all,
        grouped: [
            {
                id: 'DEFAULT_FOLDERS',
                title: c('Group').t`Default folders`,
                items: defaultFolders,
            },
            { id: 'CUSTOM_FOLDERS', title: c('Group').t`Custom folders`, items: customFolders },
            { id: 'LABELS', title: c('Group').t`Labels`, items: labelOptions },
        ],
        findItemByValue: (value: string) => all.find((item) => item.value === value),
        isDefaultFolder: (item: Item): item is ItemDefaultFolder => 'url' in item && 'icon' in item,
        isCustomFolder: (item: Item): item is ItemCustomFolder => 'folderEntity' in item,
        isLabel: (item: Item): item is ItemLabel => 'color' in item,
    };
}
