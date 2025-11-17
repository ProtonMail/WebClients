import { useCallback } from 'react';

import { getEncryptionPreferencesThunk } from '@proton/mail/store/messages/encryptionPreferences';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { GetEncryptionPreferences } from '@proton/shared/lib/interfaces/hooks/GetEncryptionPreferences';

/**
 * Given an email address and the user mail settings, return the encryption preferences for sending to that email.
 * The logic for how those preferences are determined is laid out in the
 * Confluence document 'Encryption preferences for outgoing email'.
 * NB: the current logic does not handle internal address keys belonging to external accounts, since these keys are not used by Inbox.
 */
const useGetEncryptionPreferences = () => {
    const dispatch = useDispatch();
    return useCallback<GetEncryptionPreferences>((args) => dispatch(getEncryptionPreferencesThunk(args)), [dispatch]);
};

export default useGetEncryptionPreferences;
