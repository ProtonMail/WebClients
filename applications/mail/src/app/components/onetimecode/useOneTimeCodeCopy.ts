import { useCallback } from 'react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';

import type { Element } from '../../models/element';

/**
 * Owns the side effect of copying a one-time code: the email has no further use
 * once the code is copied, so it is moved to Trash, where it stays recoverable
 * and the move flow shows an automatic Undo notification. Shared by the
 * opened-email banner and the list row so the behaviour lives in one place.
 *
 * `movesToTrash` is currently always true; it is surfaced so the button keeps
 * its tooltip honest and so the upcoming user preference (a synced MailSettings
 * field, separate MR) can gate it here without touching the consumers.
 */
export const useOneTimeCodeCopy = () => {
    const { applyLocation } = useApplyLocation();
    const movesToTrash = true;

    const onCopy = useCallback(
        (elements: Element[]) => {
            void applyLocation({
                type: APPLY_LOCATION_TYPES.MOVE,
                elements,
                destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
            });
        },
        [applyLocation]
    );

    return { movesToTrash, onCopy };
};
