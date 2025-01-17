import { useHistory } from 'react-router-dom';

import type { HotkeyTuple } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';
import { isBusy } from '@proton/shared/lib/shortcuts/helpers';

import useMailModel from 'proton-mail/hooks/useMailModel';

const { DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, TRASH, SPAM, ARCHIVE, INBOX, STARRED, ALL_MAIL, ALMOST_ALL_MAIL } =
    MAILBOX_LABEL_IDS;

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
                          navigateTo(INBOX);
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
                          navigateTo(hasBit(ShowMoved, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS);
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
                          navigateTo(hasBit(ShowMoved, SHOW_MOVED.SENT) ? ALL_SENT : SENT);
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
                          navigateTo(STARRED);
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
                          navigateTo(ARCHIVE);
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
                          navigateTo(SPAM);
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
                          navigateTo(TRASH);
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
                          navigateTo(AlmostAllMail ? ALMOST_ALL_MAIL : ALL_MAIL);
                      }
                  },
              ],
          ]
        : [];
};
