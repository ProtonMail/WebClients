import { c } from 'ttag';
import { FeatureCode, useFeature, useFolders, useLabels, useMailSettings } from '@proton/components';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from '@proton/shared/lib/constants';
import { formatFolderName, buildTreeview } from '@proton/shared/lib/helpers/folder';
import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getStandardFolders } from '../../../helpers/labels';

export interface LocationFieldLabel {
    text: string;
    value: string;
    url?: string;
    icon: string | undefined;
    folderLvlClass?: string;
    labelColor?: string;
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

function folderReducer(acc: LocationFieldLabel[], folder: FolderWithSubFolders, level = 0) {
    acc.push({
        text: formatFolderName(level, folder.Name),
        value: folder.ID,
        url: folder.ID,
        icon: folder.subfolders?.length ? 'folders' : 'folder',
        folderLvlClass: getMarginByFolderLvl(level),
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => folderReducer(acc, folder, level + 1));
    }

    return acc;
}

function useLocationFieldOptions() {
    const [mailSettings] = useMailSettings();
    const [labels = []] = useLabels();
    const [folders] = useFolders();
    const treeview: FolderWithSubFolders[] = buildTreeview(folders);
    const { feature: scheduledFeature } = useFeature(FeatureCode.ScheduledSend);

    const DRAFT_TYPE = hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS;
    const defaultOptions: LocationFieldLabel[] = [
        { value: ALL_MAIL, text: c('Mailbox').t`All mail`, url: '/all-mail', icon: 'envelopes' },
        { value: INBOX, text: STANDARD_FOLDERS[INBOX].name, url: STANDARD_FOLDERS[INBOX].to, icon: 'inbox' },
        {
            value: DRAFT_TYPE,
            text: STANDARD_FOLDERS[DRAFT_TYPE].name,
            url: STANDARD_FOLDERS[DRAFT_TYPE].to,
            icon: 'file-lines',
        },
        ...(scheduledFeature?.Value
            ? [
                  {
                      value: SCHEDULED,
                      text: STANDARD_FOLDERS[SCHEDULED].name,
                      url: STANDARD_FOLDERS[SCHEDULED].to,
                      icon: 'clock',
                  },
              ]
            : []),
        {
            value: hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.SENT) ? ALL_SENT : SENT,
            text: c('Mailbox').t`Sent`,
            icon: 'paper-plane',
            url: '/sent',
        },
        { value: STARRED, text: c('Mailbox').t`Starred`, url: '/starred', icon: 'star' },
        {
            value: ARCHIVE,
            text: STANDARD_FOLDERS[ARCHIVE].name,
            url: STANDARD_FOLDERS[ARCHIVE].to,
            icon: 'box-archive',
        },
        { value: SPAM, text: STANDARD_FOLDERS[SPAM].name, url: STANDARD_FOLDERS[SPAM].to, icon: 'fire' },
        { value: TRASH, text: STANDARD_FOLDERS[TRASH].name, url: STANDARD_FOLDERS[TRASH].to, icon: 'trash' },
    ];

    const labelOptions = labels.map<LocationFieldLabel>(({ ID: value, Name: text, Color: color }) => ({
        value,
        text,
        url: value,
        icon: undefined,
        labelColor: color,
    }));
    const customOptions = treeview.reduce<LocationFieldLabel[]>((acc, folder) => folderReducer(acc, folder), []);
    const allOptions = defaultOptions.concat(labelOptions).concat(customOptions);

    return {
        all: allOptions,
        grouped: [
            {
                id: 'DEFAULT',
                title: c('Group').t`Default folders`,
                items: defaultOptions,
            },
            { id: 'FOLDERS', title: c('Group').t`Custom folders`, items: customOptions },
            { id: 'LABELS', title: c('Group').t`Labels`, items: labelOptions },
        ],
        getTextFromValue: (value: string) => allOptions.find((item) => item.value === value),
    };
}

export default useLocationFieldOptions;
