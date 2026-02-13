import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import type { CommanderItemInterface, HotkeyTuple } from '@proton/components';
import type { Hotkey } from '@proton/components/hooks/useHotkeys';
import { getCategoryCommanderKeyboardShortcut } from '@proton/mail';
import { getLabelFromCategoryIdInCommander } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { isBusy } from '@proton/shared/lib/shortcuts/helpers';

import { categoryColorClassName } from './categoriesTabs/tabsInterface';
import { useCategoriesView } from './useCategoriesView';

export const useCategoriesShortcuts = () => {
    const history = useHistory();
    const { activeCategoriesTabs, categoryViewAccess } = useCategoriesView();

    const navigateTo = (labelID: MAILBOX_LABEL_IDS) => {
        history.push(`/${LABEL_IDS_TO_HUMAN[labelID]}`);
    };

    const moveToCategoriesOption: CommanderItemInterface[] =
        categoryViewAccess && activeCategoriesTabs.length > 0
            ? activeCategoriesTabs.map((category) => ({
                  icon: category.outlinedIcon,
                  label: getLabelFromCategoryIdInCommander(category.id),
                  value: category.id,
                  action: () => navigateTo(category.id),
                  shortcuts: getCategoryCommanderKeyboardShortcut(category.id),
                  iconProps: {
                      iconClassName: categoryColorClassName,
                      iconDataColor: category.colorShade,
                  },
              }))
            : [
                  {
                      icon: 'inbox',
                      label: c('Commander action').t`Go to Inbox`,
                      value: 'inbox',
                      action: () => navigateTo(MAILBOX_LABEL_IDS.INBOX),
                      shortcuts: ['G', 'I'],
                  },
              ];

    const categoriesAndInboxShortcuts: HotkeyTuple[] =
        categoryViewAccess && activeCategoriesTabs.length > 0
            ? activeCategoriesTabs.map((tab): HotkeyTuple => {
                  const [first, second] = getCategoryCommanderKeyboardShortcut(tab.id) as Hotkey[];
                  return [
                      first,
                      second,
                      (e: KeyboardEvent) => {
                          if (!isBusy(e)) {
                              e.stopPropagation();
                              e.preventDefault();
                              navigateTo(tab.id);
                          }
                      },
                  ];
              })
            : [
                  [
                      'G',
                      'I',
                      (e: KeyboardEvent) => {
                          if (!isBusy(e)) {
                              e.stopPropagation();
                              e.preventDefault();
                              navigateTo(MAILBOX_LABEL_IDS.INBOX);
                          }
                      },
                  ],
              ];

    return {
        moveToCategoriesOption,
        categoriesAndInboxShortcuts,
    };
};
