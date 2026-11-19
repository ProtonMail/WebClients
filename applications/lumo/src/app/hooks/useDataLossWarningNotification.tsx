import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { dismissDataLossWarning, selectDataLossWarnings } from '../redux/slices/meta/errors';
import { acknowledgeLumoDataLossWarning } from '../redux/slices/meta/initialization';

/**
 * Surfaces `addDataLossWarning` (dispatched from `lumoBootstrap` when every master key envelope
 * is undecryptable — typically after a password reset without a data-recovery method) as a
 * dismissible toast. A fresh master key has already been minted by the time this fires, so the
 * app is usable; this is purely informational about the pre-reset data being unrecoverable.
 *
 * Deliberately separate from `MasterKeyBanner`, which reports an ongoing, blocking failure.
 *
 * Records that the recovery warning was shown so settings sync can replace the pre-reset blob.
 */
export const useDataLossWarningNotification = () => {
    const { createNotification } = useNotifications();
    const dispatch = useLumoDispatch();
    const warnings = useLumoSelector((state) => selectDataLossWarnings({ errors: state.errors }));
    const shown = useRef<Set<string>>(new Set());

    useEffect(() => {
        for (const warning of warnings) {
            if (shown.current.has(warning.id)) continue;
            shown.current.add(warning.id);
            createNotification({
                type: 'warning',
                text: c('collider_2025: Error')
                    .t`Your existing ${LUMO_SHORT_APP_NAME} data can't be decrypted with your current account keys. If you recover your previous keys it will become available again. You can keep using ${LUMO_SHORT_APP_NAME} normally.`,
                expiration: 8000,
            });
            dispatch(dismissDataLossWarning(warning.id));
            dispatch(acknowledgeLumoDataLossWarning());
        }
    }, [warnings, createNotification, dispatch]);
};
