import { c } from 'ttag';

import { type TwoFactorCredentials, auth2FA } from '@proton/shared/lib/api/auth';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TOTPError } from '@proton/shared/lib/authentication/error';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces';

/**
 * Verifies the second factor for the session.
 * A wrong code throws a `TOTPError`, so the caller can let the user retry.
 */
export const verifyTwoFactor = async ({ api, credentials }: { api: Api; credentials: TwoFactorCredentials }) => {
    if (credentials.type === 'fido2') {
        await api(auth2FA({ FIDO2: credentials.payload }));
        return;
    }

    await api(auth2FA({ TwoFactorCode: credentials.payload })).catch((e) => {
        if (e.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
            throw new TOTPError(getApiErrorMessage(e) || c('Error').t`Incorrect login credentials. Please try again.`);
        }
        throw e;
    });
};
