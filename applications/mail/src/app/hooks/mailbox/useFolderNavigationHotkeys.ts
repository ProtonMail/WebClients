import { useHistory } from 'react-router-dom';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { isTargetEditable } from 'proton-shared/lib/shortcuts/helpers';
import { KeyboardKey } from 'proton-shared/lib/interfaces';
import { HotkeyTuple, useMailSettings } from 'react-components';
import { LABEL_IDS_TO_HUMAN } from '../../constants';

const { DRAFTS, SENT, TRASH, SPAM, ARCHIVE, INBOX, STARRED, ALL_MAIL } = MAILBOX_LABEL_IDS;

export const useFolderNavigationHotkeys = (): HotkeyTuple[] => {
    const history = useHistory<any>();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const setFocusOnSidebar = () => {
        const sidebarLink = document.querySelector(
            '[data-shortcut-target~="navigation-link"][aria-current="page"]'
        ) as HTMLElement;
        sidebarLink?.focus();
    };

    const navigateTo = (labelID: MAILBOX_LABEL_IDS) => {
        history.push(`/${LABEL_IDS_TO_HUMAN[labelID]}`);
    };

    return Shortcuts
        ? [
              [
                  'G',
                  'I',
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(INBOX);
                          setFocusOnSidebar();
                      }
                  },
              ],
              [
                  'G',
                  'D',
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(DRAFTS);
                          setFocusOnSidebar();
                      }
                  },
              ],
              [
                  'G',
                  'E',
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(SENT);
                          setFocusOnSidebar();
                      }
                  },
              ],
              [
                  'G',
                  KeyboardKey.Star,
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(STARRED);
                          setFocusOnSidebar();
                      }
                  },
              ],
              [
                  'G',
                  'A',
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(ARCHIVE);
                          setFocusOnSidebar();
                      }
                  },
              ],
              [
                  'G',
                  'S',
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(SPAM);
                          setFocusOnSidebar();
                      }
                  },
              ],
              [
                  'G',
                  'T',
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(TRASH);
                          setFocusOnSidebar();
                      }
                  },
              ],
              [
                  'G',
                  'M',
                  (e) => {
                      if (!isTargetEditable(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(ALL_MAIL);
                          setFocusOnSidebar();
                      }
                  },
              ],
          ]
        : [];
};
