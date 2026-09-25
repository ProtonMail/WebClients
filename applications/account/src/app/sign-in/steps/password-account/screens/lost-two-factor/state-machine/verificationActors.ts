import { fromPromise } from 'xstate';

import { initiateVerification, sendNewCode, verifyCode } from '@proton/account/safetyReview/verification/verification';
import { getMnemonicAuthInfo, reauthMnemonic } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { disable2FA } from '@proton/shared/lib/api/settings';
import { reauthByEmailVerification, reauthBySmsVerification } from '@proton/shared/lib/api/verify';
import { InvalidCodeError } from '@proton/shared/lib/authentication/error';
import type { InfoResponse } from '@proton/shared/lib/authentication/interface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { srpAuth } from '@proton/shared/lib/srp';

import { verifyTwoFactor } from '../../../../../auth/secondFactor';
import type { SignInActorServices } from '../../../../../state-machine/signInActors';
import { type VerificationMethod, type VerificationResult, lost2FAStateMachine } from './lost2FAStateMachine';

const getReauthConfig = (method: VerificationMethod) =>
    method === 'email' ? reauthByEmailVerification() : reauthBySmsVerification();

/** The code screen only runs once a code was sent; checked here, so a missing one fails like a request. */
const getToken = (token: string | undefined) => {
    if (!token) {
        throw new Error('Missing verification');
    }
    return token;
};

/** The lost-2FA verifications' requests, built from the app's services. */
export const createVerificationActors = ({ api }: Pick<SignInActorServices, 'api'>) => ({
    /** A backup code is a second factor; a wrong one throws a `TOTPError`, so the user can retry. */
    verifyBackupCode: fromPromise<void, { code: string }>(({ input }) =>
        verifyTwoFactor({ api, credentials: { type: 'code', payload: input.code } })
    ),
    sendVerificationCode: fromPromise<VerificationResult, { method: VerificationMethod }>(({ input }) =>
        initiateVerification({ api, method: input.method, config: getReauthConfig(input.method) })
    ),
    resendVerificationCode: fromPromise<void, { method: VerificationMethod; token: string | undefined }>(
        async ({ input }) => sendNewCode({ api, method: input.method, token: getToken(input.token) })
    ),
    /** A wrong code throws an `InvalidCodeError`, so the user can retry. */
    verifyCodeAndDisable2FA: fromPromise<void, { method: VerificationMethod; token: string | undefined; code: string }>(
        async ({ input }) => {
            await verifyCode({
                api,
                method: input.method,
                token: getToken(input.token),
                code: input.code,
                config: getReauthConfig(input.method),
            }).catch((error: unknown) => {
                const { code, message } = getApiError(error);
                throw code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID ? new InvalidCodeError(message ?? '') : error;
            });
            await api(disable2FA());
        }
    ),
    verifyPhraseAndDisable2FA: fromPromise<void, { username: string; phrase: string }>(
        async ({ input: { username, phrase } }) => {
            const randomBytes = await mnemonicToBase64RandomBytes(phrase);
            const info = await api<InfoResponse>(getMnemonicAuthInfo(username));
            await srpAuth({
                info,
                api,
                config: reauthMnemonic({ Username: username, PersistentCookies: false }),
                credentials: { username, password: randomBytes },
            });
            await api(disable2FA());
        }
    ),
});

export type VerificationActors = ReturnType<typeof createVerificationActors>;

/** The lost-2FA flow with its verifications' requests; the password account flow runs it as a child. */
export const createLost2FAFlow = (services: Pick<SignInActorServices, 'api'>) =>
    lost2FAStateMachine.provide({ actors: createVerificationActors(services) });
