import { c } from 'ttag';

import { useRetentionPolicies } from '@proton/account/retentionPolicies/hooks';
import type { IconName } from '@proton/icons/types';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { buildTreeview } from '@proton/shared/lib/helpers/folder';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { categoryColorClassName } from 'proton-mail/components/categoryView/categoriesTabs/tabsInterface';
import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';

import { getStandardFolders } from '../../../../helpers/labels';
import useScheduleSendFeature from '../../../composer/actions/scheduleSend/useScheduleSendFeature';
import { buildFolderOption, folderReducer } from './advancesSearchFieldHelpers';

interface ItemBase {
    text: string;
    value: string;
}

export interface ItemDefaultFolder extends ItemBase {
    icon: IconName;
    url: string;
    className?: string;
    color?: string;
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
}

export function useLocationFieldOptions(): UseLocationFieldOptionsReturn {
    const [mailSettings] = useMailSettings();
    const [labels = []] = useLabels();
    const [folders] = useFolders();
    const treeview = buildTreeview(folders);
    const { canScheduleSend } = useScheduleSendFeature();
    const [retentionRules] = useRetentionPolicies();
    const hasRetentionRules = !!retentionRules?.length;

    const folderMap = getStandardFolders();

    const categoryView = useCategoriesView();
    const categoriesOptions: ItemDefaultFolder[] = categoryView.categoryViewAccess
        ? categoryView.activeCategoriesTabs.map((category) => {
              return {
                  value: category.id,
                  text: getLabelFromCategoryId(category.id),
                  url: `/${LABEL_IDS_TO_HUMAN[category.id]}`,
                  icon: category.filledIcon,
                  className: categoryColorClassName,
                  color: category.colorShade,
              };
          })
        : [buildFolderOption(folderMap, MAILBOX_LABEL_IDS.INBOX)];

    const defaultFolders: ItemDefaultFolder[] = [
        buildFolderOption(
            folderMap,
            mailSettings.AlmostAllMail ? MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL : MAILBOX_LABEL_IDS.ALL_MAIL
        ),
        ...categoriesOptions,
        buildFolderOption(folderMap, MAILBOX_LABEL_IDS.SNOOZED),
        buildFolderOption(
            folderMap,
            hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS) ? MAILBOX_LABEL_IDS.ALL_DRAFTS : MAILBOX_LABEL_IDS.DRAFTS
        ),
        ...(canScheduleSend ? [buildFolderOption(folderMap, MAILBOX_LABEL_IDS.SCHEDULED)] : []),
        buildFolderOption(
            folderMap,
            hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT) ? MAILBOX_LABEL_IDS.ALL_SENT : MAILBOX_LABEL_IDS.SENT
        ),
        buildFolderOption(folderMap, MAILBOX_LABEL_IDS.STARRED),
        buildFolderOption(folderMap, MAILBOX_LABEL_IDS.ARCHIVE),
        buildFolderOption(folderMap, MAILBOX_LABEL_IDS.SPAM),
        buildFolderOption(folderMap, MAILBOX_LABEL_IDS.TRASH),
        ...(hasRetentionRules ? [buildFolderOption(folderMap, MAILBOX_LABEL_IDS.SOFT_DELETED)] : []),
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
    };
}
