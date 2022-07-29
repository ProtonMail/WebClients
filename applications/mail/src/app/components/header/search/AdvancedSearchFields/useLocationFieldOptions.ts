import { c } from 'ttag';

import { FeatureCode, IconName, useFeature, useFolders, useLabels, useMailSettings } from '@proton/components';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { getLabelIDsToI18N } from '../../../../constants';
import { getStandardFolders } from '../../../../helpers/labels';

interface ItemBase {
    text: string;
    value: string;
}

interface ItemDefaultFolder extends ItemBase {
    icon: IconName;
    url: string;
}
interface ItemCustomFolder extends ItemBase {
    folderEntity: FolderWithSubFolders;
    className: string;
}

interface ItemLabel extends ItemBase {
    color: string;
}
type Item = ItemCustomFolder | ItemDefaultFolder | ItemLabel;
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

const { INBOX, TRASH, SPAM, STARRED, ARCHIVE, ALL_MAIL, ALL_SENT, SENT, ALL_DRAFTS, DRAFTS, SCHEDULED } =
    MAILBOX_LABEL_IDS;

const STANDARD_FOLDERS = getStandardFolders();
const getMarginByFolderLvl = (lvl: number) => {
    switch (lvl) {
        case 1:
            return 'ml0-5';
        case 2:
        case 3:
        case 4:
            return 'ml1';
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
    const [mailSettings] = useMailSettings();
    const [labels = []] = useLabels();
    const [folders] = useFolders();
    const treeview = buildTreeview(folders);
    const { feature: scheduledFeature } = useFeature(FeatureCode.ScheduledSend);

    const DRAFT_TYPE = hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS;
    const SENT_TYPE = hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.SENT) ? ALL_SENT : SENT;
    const defaultFolders: ItemDefaultFolder[] = [
        { value: ALL_MAIL, text: getLabelIDsToI18N()[ALL_MAIL], url: '/all-mail', icon: 'envelopes' },
        { value: INBOX, text: getLabelIDsToI18N()[INBOX], url: STANDARD_FOLDERS[INBOX].to, icon: 'inbox' },
        {
            value: DRAFT_TYPE,
            text: DRAFT_TYPE === ALL_DRAFTS ? getLabelIDsToI18N()[ALL_DRAFTS] : getLabelIDsToI18N()[DRAFTS],
            url: STANDARD_FOLDERS[DRAFT_TYPE].to,
            icon: 'file-lines',
        },
        ...(scheduledFeature?.Value
            ? [
                  {
                      value: SCHEDULED,
                      text: getLabelIDsToI18N()[SCHEDULED],
                      url: STANDARD_FOLDERS[SCHEDULED].to,
                      icon: 'clock' as const,
                  },
              ]
            : []),
        {
            value: SENT_TYPE,
            text: SENT_TYPE === ALL_SENT ? getLabelIDsToI18N()[ALL_SENT] : getLabelIDsToI18N()[SENT],
            url: '/sent',
            icon: 'paper-plane',
        },
        { value: STARRED, text: getLabelIDsToI18N()[STARRED], url: '/starred', icon: 'star' },
        {
            value: ARCHIVE,
            text: getLabelIDsToI18N()[ARCHIVE],
            url: STANDARD_FOLDERS[ARCHIVE].to,
            icon: 'archive-box',
        },
        { value: SPAM, text: getLabelIDsToI18N()[SPAM], url: STANDARD_FOLDERS[SPAM].to, icon: 'fire' },
        { value: TRASH, text: getLabelIDsToI18N()[TRASH], url: STANDARD_FOLDERS[TRASH].to, icon: 'trash' },
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
