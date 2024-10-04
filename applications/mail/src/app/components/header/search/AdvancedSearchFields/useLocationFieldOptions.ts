import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { getStandardFolders } from '../../../../helpers/labels';
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

const STANDARD_FOLDERS = getStandardFolders();
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

export function useLocationFieldOptions(): UseLocationFieldOptionsReturn {
    const mailSettings = useMailModel('MailSettings');
    const [labels = []] = useLabels();
    const [folders] = useFolders();
    const treeview = buildTreeview(folders);
    const { canScheduleSend } = useScheduleSendFeature();

    const DRAFT_TYPE = hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS;
    const SENT_TYPE = hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT) ? ALL_SENT : SENT;
    const { AlmostAllMail } = mailSettings;
    const defaultFolders: ItemDefaultFolder[] = [
        AlmostAllMail
            ? {
                  value: ALMOST_ALL_MAIL,
                  text: STANDARD_FOLDERS[ALMOST_ALL_MAIL].name,
                  url: STANDARD_FOLDERS[ALMOST_ALL_MAIL].to,
                  icon: STANDARD_FOLDERS[ALMOST_ALL_MAIL].icon,
              }
            : {
                  value: ALL_MAIL,
                  text: STANDARD_FOLDERS[ALL_MAIL].name,
                  url: STANDARD_FOLDERS[ALL_MAIL].to,
                  icon: STANDARD_FOLDERS[ALL_MAIL].icon,
              },
        {
            value: INBOX,
            text: STANDARD_FOLDERS[INBOX].name,
            url: STANDARD_FOLDERS[INBOX].to,
            icon: STANDARD_FOLDERS[INBOX].icon,
        },
        {
            value: SNOOZED,
            text: STANDARD_FOLDERS[SNOOZED].name,
            url: STANDARD_FOLDERS[SNOOZED].to,
            icon: STANDARD_FOLDERS[SNOOZED].icon,
        },
        {
            value: DRAFT_TYPE,
            text: DRAFT_TYPE === ALL_DRAFTS ? STANDARD_FOLDERS[ALL_DRAFTS].name : STANDARD_FOLDERS[DRAFTS].name,
            url: STANDARD_FOLDERS[DRAFT_TYPE].to,
            icon: STANDARD_FOLDERS[DRAFT_TYPE].icon,
        },
        ...(canScheduleSend
            ? [
                  {
                      value: SCHEDULED,
                      text: STANDARD_FOLDERS[SCHEDULED].name,
                      url: STANDARD_FOLDERS[SCHEDULED].to,
                      icon: STANDARD_FOLDERS[SCHEDULED].icon,
                  },
              ]
            : []),
        {
            value: SENT_TYPE,
            text: SENT_TYPE === ALL_SENT ? STANDARD_FOLDERS[ALL_SENT].name : STANDARD_FOLDERS[SENT].name,
            url: STANDARD_FOLDERS[SENT_TYPE].to,
            icon: STANDARD_FOLDERS[SENT_TYPE].icon,
        },
        {
            value: STARRED,
            text: STANDARD_FOLDERS[STARRED].name,
            url: STANDARD_FOLDERS[STARRED].to,
            icon: STANDARD_FOLDERS[STARRED].icon,
        },
        {
            value: ARCHIVE,
            text: STANDARD_FOLDERS[ARCHIVE].name,
            url: STANDARD_FOLDERS[ARCHIVE].to,
            icon: STANDARD_FOLDERS[ARCHIVE].icon,
        },
        {
            value: SPAM,
            text: STANDARD_FOLDERS[SPAM].name,
            url: STANDARD_FOLDERS[SPAM].to,
            icon: STANDARD_FOLDERS[SPAM].icon,
        },
        {
            value: TRASH,
            text: STANDARD_FOLDERS[TRASH].name,
            url: STANDARD_FOLDERS[TRASH].to,
            icon: STANDARD_FOLDERS[TRASH].icon,
        },
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
