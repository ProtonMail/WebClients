import { c } from 'ttag';
import { FeatureCode, useFeature, useFolders, useLabels, useMailSettings } from '@proton/components';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from '@proton/shared/lib/constants';
import { formatFolderName, buildTreeview } from '@proton/shared/lib/helpers/folder';
import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

export interface LocationFieldLabel {
    text: string;
    value: string;
}

const { INBOX, TRASH, SPAM, STARRED, ARCHIVE, ALL_MAIL, ALL_SENT, SENT, ALL_DRAFTS, DRAFTS, SCHEDULED } =
    MAILBOX_LABEL_IDS;

function folderReducer(acc: LocationFieldLabel[], folder: FolderWithSubFolders, level = 0) {
    acc.push({
        text: formatFolderName(level, folder.Name, ' ∙ '),
        value: folder.ID,
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

    const defaultOptions: LocationFieldLabel[] = [
        { value: ALL_MAIL, text: c('Mailbox').t`All mail` },
        { value: INBOX, text: c('Mailbox').t`Inbox` },
        {
            value: hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS,
            text: c('Mailbox').t`Drafts`,
        },
        ...(scheduledFeature?.Value
            ? [
                  {
                      value: SCHEDULED,
                      text: c('Mailbox').t`Scheduled`,
                  },
              ]
            : []),
        {
            value: hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.SENT) ? ALL_SENT : SENT,
            text: c('Mailbox').t`Sent`,
        },
        { value: STARRED, text: c('Mailbox').t`Starred` },
        { value: ARCHIVE, text: c('Mailbox').t`Archive` },
        { value: SPAM, text: c('Mailbox').t`Spam` },
        { value: TRASH, text: c('Mailbox').t`Trash` },
    ];

    const labelOptions = labels.map<LocationFieldLabel>(({ ID: value, Name: text }) => ({
        value,
        text,
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
