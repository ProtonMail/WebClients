import { useCallback } from 'react';

import type { OtpGateSource } from '@proton/mail-message/helpers/message/otp/shouldRunOtpExtraction';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import { APPLY_LOCATION_TYPES } from '../../hooks/actions/applyLocation/interface';
import { useApplyLocation } from '../../hooks/actions/applyLocation/useApplyLocation';
import type { Element } from '../../models/element';
import { COPIED_STATE_DURATION_MS } from './OneTimeCodeCopyButton';
import type { OneTimeCodeLocation } from './oneTimeCodeEvents';
import { codeCopiedEvent } from './oneTimeCodeEvents';
import { useOneTimeCodeMoveToTrashPreference } from './useOneTimeCodeSettings';

/**
 * Owns the side effect of copying a one-time code: unless the user turned off
 * "Move to Trash" in quick settings, the email is moved to Trash, where it stays
 * recoverable via the automatic Undo. Shared by the opened-email banner and the
 * list row so the behaviour lives in one place.
 *
 * Called on the click. The copy is reported at once; the move waits for the
 * button's copied state and is not cancelled if the button unmounts meanwhile,
 * so a copy always ends with the Trash move it was clicked with.
 */
export const useOneTimeCodeCopy = () => {
    const { applyLocation } = useApplyLocation();
    const [movesToTrash] = useOneTimeCodeMoveToTrashPreference();

    const onCopy = useCallback(
        (elements: Element[], location: OneTimeCodeLocation, gateSource: OtpGateSource) => {
            tracker.emit(codeCopiedEvent, { dimensions: { location, gateSource, isMovedToTrash: movesToTrash } });

            if (!movesToTrash) {
                return;
            }

            setTimeout(() => {
                void applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements,
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                });
            }, COPIED_STATE_DURATION_MS);
        },
        [applyLocation, movesToTrash]
    );

    return { movesToTrash, onCopy };
};
