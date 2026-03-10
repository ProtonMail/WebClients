import { bornPrivateRecovery } from '@proton/shared/lib/api/born-private';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';

import type { AuthenticateDonationUserResult } from '../../emailReservation/helpers/emailReservationRequests';

export interface BornPrivateRecoveryParams {
    api: Api;
    auth: Pick<AuthenticateDonationUserResult, 'UID' | 'AccessToken'>;
    parentEmail: string;
    reservedEmail: string;
    /** Generated activation key for the reserved account; sent to the backend. */
    activationKey: string;
}

/**
 * The recovery resends an email with the updated password to the reserved account
 */
export const recoverBornPrivateDetails = async ({
    api,
    auth,
    parentEmail,
    reservedEmail,
    activationKey,
}: BornPrivateRecoveryParams): Promise<void> => {
    const activationKeyBase64 = new TextEncoder().encode(activationKey).toBase64();
    await api(
        withAuthHeaders(
            auth.UID,
            auth.AccessToken,
            bornPrivateRecovery({
                ParentEmail: parentEmail,
                ReservedEmail: reservedEmail,
                ActivationKey: activationKeyBase64,
            })
        )
    );
};
