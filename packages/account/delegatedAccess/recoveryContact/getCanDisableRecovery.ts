import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';

import type { EnrichedOutgoingDelegatedAccess } from '../shared/outgoing/interface';

/**
 * Ensure at least one account recovery method is enabled in case a user has recovery contacts
 */
export const getCanDisableRecovery = ({
    recoveryContacts,
    userSettings,
}: {
    recoveryContacts: EnrichedOutgoingDelegatedAccess[] | undefined;
    userSettings: UserSettings | undefined;
}) => {
    const hasRecoveryContacts = Boolean(recoveryContacts && recoveryContacts.length > 0);
    const hasRecoveryByEmail = Boolean(userSettings && !!userSettings.Email.Reset && !!userSettings.Email.Value);
    const hasRecoveryByPhone = Boolean(userSettings && !!userSettings.Phone.Reset && !!userSettings.Phone.Value);

    return {
        canDisablePhone: !hasRecoveryContacts || hasRecoveryByEmail,
        canDisableEmail: !hasRecoveryContacts || hasRecoveryByPhone,
    };
};
