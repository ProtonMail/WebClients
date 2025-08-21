import { useHistory } from 'react-router-dom';

import type { HotkeyTuple } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';
import { isBusy } from '@proton/shared/lib/shortcuts/helpers';

import useMailModel from 'proton-mail/hooks/useMailModel';

export const useFolderNavigationHotkeys = (): HotkeyTuple[] => {
    const history = useHistory<any>();
    const { Shortcuts, ShowMoved, AlmostAllMail } = useMailModel('MailSettings');

    const navigateTo = (labelID: MAILBOX_LABEL_IDS) => {
        history.push(`/${LABEL_IDS_TO_HUMAN[labelID]}`);
    };

    return Shortcuts
        ? [
              [
                  'G',
                  'I',
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(MAILBOX_LABEL_IDS.INBOX);
                      }
                  },
              ],
              [
                  'G',
                  'D',
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(
                              hasBit(ShowMoved, SHOW_MOVED.DRAFTS)
                                  ? MAILBOX_LABEL_IDS.ALL_DRAFTS
                                  : MAILBOX_LABEL_IDS.DRAFTS
                          );
                      }
                  },
              ],
              [
                  'G',
                  'E',
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(
                              hasBit(ShowMoved, SHOW_MOVED.SENT) ? MAILBOX_LABEL_IDS.ALL_SENT : MAILBOX_LABEL_IDS.SENT
                          );
                      }
                  },
              ],
              [
                  'G',
                  KeyboardKey.Star,
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(MAILBOX_LABEL_IDS.STARRED);
                      }
                  },
              ],
              [
                  'G',
                  'A',
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(MAILBOX_LABEL_IDS.ARCHIVE);
                      }
                  },
              ],
              [
                  'G',
                  'S',
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(MAILBOX_LABEL_IDS.SPAM);
                      }
                  },
              ],
              [
                  'G',
                  'T',
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(MAILBOX_LABEL_IDS.TRASH);
                      }
                  },
              ],
              [
                  'G',
                  'M',
                  (e) => {
                      if (!isBusy(e)) {
                          e.stopPropagation();
                          e.preventDefault();
                          navigateTo(AlmostAllMail ? MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL : MAILBOX_LABEL_IDS.ALL_MAIL);
                      }
                  },
              ],
          ]
        : [];
};
