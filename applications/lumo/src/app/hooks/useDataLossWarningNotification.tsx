import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { dismissDataLossWarning, selectDataLossWarnings } from '../redux/slices/meta/errors';
import { setRemoteUserSettingsUndecryptable } from '../redux/slices/meta/initialization';

/**
 * Surfaces `addDataLossWarning` (dispatched from `lumoBootstrap` when every master key envelope
 * is undecryptable — typically after a password reset without a data-recovery method) as a
 * dismissible toast. A fresh master key has already been minted by the time this fires, so the
 * app is usable; this is purely informational about the pre-reset data being unrecoverable.
 *
 * Deliberately separate from `MasterKeyBanner`, which reports an ongoing, blocking failure.
 *
 * Also clears `remoteUserSettingsUndecryptable`: once the user has been told their pre-reset data
 * is gone, there is no more reason to keep refusing to sync settings to the server — that flag
 * exists only to protect the old blob for the brief window before the user has even been told
 * about the loss. Without this, a user who never recovers their old keys would never see their
 * settings sync again (see LUMO-853 follow-up discussion).
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
            dispatch(setRemoteUserSettingsUndecryptable(false));
        }
    }, [warnings, createNotification, dispatch]);
};
