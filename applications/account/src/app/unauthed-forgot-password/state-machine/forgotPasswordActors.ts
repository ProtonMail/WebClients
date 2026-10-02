/**
 * The forgot-password machine's requests, built from the app's services; `useForgotPasswordMachine` provides them and
 * tests provide fakes. The telemetry for what a request found goes with the request.
 */
import { fromPromise } from 'xstate';

import type { AutoResetTokenPayload, RecoveryMethod, ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { requestLoginResetToken, validateResetToken } from '@proton/shared/lib/api/reset';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import type { OnLoginCallback } from '../../content/authSession';
import type { useResetPasswordTelemetry } from '../../reset/resetPasswordTelemetry';
import {
    DeviceRecoveryLevel,
    type MnemonicData,
    NoResetMethodsError,
    authMnemonicAndGetKeys,
    getDeviceRecoveryLevel,
    handleRequestRecoveryMethods,
    performPasswordChangeViaMnemonic,
    performPasswordReset,
} from '../actions';

export type MnemonicDataWithoutAPI = Omit<MnemonicData, 'api'>;

/** What the account can recover with, and where its codes go (redacted); from the username alone. */
export interface RecoveryMethods {
    methods: RecoveryMethod[];
    username: string;
    redactedEmail: string | undefined;
    redactedPhoneNumber: string | undefined;
    hasEmergencyContacts: boolean;
}

/** Ownership proven with a code or a reset link: the reset token, and what the account can recover with it. */
export interface OwnershipProof {
    ownershipVerificationCode: string;
    resetResponse: ValidateResetTokenResponse;
    deviceRecoveryLevel: DeviceRecoveryLevel;
}

/** Where a reset code goes: the recovery email, or the recovery phone by SMS. */
export type CodeMethod = Extract<RecoveryMethod, 'email' | 'sms'>;

export interface CodeInput {
    username: string;
    method: CodeMethod;
    /** The step it's sent or checked on, for telemetry. */
    step: string;
}

export interface ResetPasswordInput {
    newPassword: string;
    username: string;
    /** What the flow recovered: the recovery phrase's keys, or a reset token. */
    mnemonicData: MnemonicDataWithoutAPI | undefined;
    resetResponse: ValidateResetTokenResponse | undefined;
    ownershipVerificationCode: string;
    ownershipVerificationMethod: RecoveryMethod | undefined;
    deviceRecoveryLevel: DeviceRecoveryLevel;
}

export interface ForgotPasswordServices {
    api: Api;
    /** Before the first request of an attempt: loads the crypto worker, then starts the auth session. */
    prepareAttempt: () => Promise<void>;
    /** The "keep me signed in" choice, for the session the reset signs in with. */
    getPersistent: () => boolean;
    getKtActivation: () => Promise<KeyTransparencyActivation>;
    productParam: ProductParam;
    setupVPN: boolean;
    onLogin: OnLoginCallback;
    telemetry: ReturnType<typeof useResetPasswordTelemetry>;
}

export const createForgotPasswordActors = (services: ForgotPasswordServices) => ({
    /** The account's recovery methods. An account without any is not an error: the flow offers the other ways. */
    requestRecoveryMethods: fromPromise<RecoveryMethods, { username: string }>(async ({ input: { username } }) => {
        const { api, telemetry } = services;
        await services.prepareAttempt();
        try {
            const result = await handleRequestRecoveryMethods({ username, api });
            telemetry.sendResetPasswordRecoveryMethodsRequested({
                hasPasswordResetMethod: result.methods.some(
                    (method) => method === 'email' || method === 'sms' || method === 'login'
                ),
                hasDataRecoveryMethod: result.methods.includes('mnemonic'),
            });
            return result;
        } catch (error) {
            if (!(error instanceof NoResetMethodsError)) {
                throw error;
            }
            telemetry.sendResetPasswordRecoveryMethodsRequested({
                hasPasswordResetMethod: false,
                hasDataRecoveryMethod: false,
            });
            return { methods: [], username, redactedEmail: '', redactedPhoneNumber: '', hasEmergencyContacts: false };
        }
    }),

    /** A reset link (username and token in the URL): a valid token proves ownership. */
    validateResetLink: fromPromise<OwnershipProof, { username: string; token: string }>(
        async ({ input: { username, token } }) => {
            await services.prepareAttempt();
            const resetResponse = await services.api<ValidateResetTokenResponse>(validateResetToken(username, token));
            services.telemetry.sendResetPasswordMethodValidated({ step: 'entry', method: 'mnemonic' });
            return { ownershipVerificationCode: token, resetResponse, deviceRecoveryLevel: DeviceRecoveryLevel.NONE };
        }
    ),

    /** A recovery link (username and recovery phrase in the URL hash): the phrase decrypts the account's keys. */
    validateRecoveryLink: fromPromise<MnemonicDataWithoutAPI, { username: string; mnemonic: string }>(
        async ({ input }) => {
            await services.prepareAttempt();
            const mnemonicData = await authMnemonicAndGetKeys({
                ...input,
                persistent: services.getPersistent(),
                api: services.api,
            });
            services.telemetry.sendResetPasswordMethodValidated({ step: 'entry', method: 'mnemonic' });
            return mnemonicData;
        }
    ),

    /** Sends a reset code to the recovery email, or the recovery phone. */
    sendResetCode: fromPromise<void, CodeInput>(async ({ input: { username, method, step } }) => {
        await services.api(
            requestLoginResetToken<AutoResetTokenPayload>({
                Username: username,
                Method: method === 'sms' ? 'phone' : 'email',
            })
        );
        services.telemetry.sendResetPasswordCodeSent({ step, method });
    }),

    /** A valid code proves ownership; a wrong one fails with the API's `INVALID_VALUE`, so the user can retry. */
    validateResetCode: fromPromise<OwnershipProof, CodeInput & { code: string }>(
        async ({ input: { username, method, step, code } }) => {
            const resetResponse = await services.api<ValidateResetTokenResponse>(validateResetToken(username, code));
            const deviceRecoveryLevel = await getDeviceRecoveryLevel(resetResponse);
            services.telemetry.sendResetPasswordMethodValidated({ step, method });
            return { ownershipVerificationCode: code, resetResponse, deviceRecoveryLevel };
        }
    ),

    /** The recovery phrase decrypts the account's keys, which the reset re-encrypts. */
    validatePhrase: fromPromise<MnemonicDataWithoutAPI, { username: string; mnemonic: string }>(({ input }) =>
        authMnemonicAndGetKeys({ ...input, persistent: services.getPersistent(), api: services.api })
    ),

    /** Sets the new password with what the flow recovered, then hands the session to the app. */
    resetPassword: fromPromise<void, ResetPasswordInput>(async ({ input }) => {
        const { api, telemetry } = services;
        const persistent = services.getPersistent();
        const recoveredWithDevice = input.deviceRecoveryLevel === DeviceRecoveryLevel.FULL;
        try {
            if (input.mnemonicData) {
                const session = await performPasswordChangeViaMnemonic({
                    newPassword: input.newPassword,
                    mnemonicData: { ...input.mnemonicData, api },
                    persistent,
                    api,
                });
                telemetry.sendResetPasswordSuccess({
                    step: 'setNewPassword',
                    method: recoveredWithDevice ? 'device-recovery' : 'mnemonic',
                });
                await services.onLogin(session);
                return;
            }
            // Every way here recovers the keys or proves ownership; checked, so a missing token fails like a request
            if (!input.resetResponse) {
                throw new Error('Missing reset token');
            }
            const session = await performPasswordReset({
                newPassword: input.newPassword,
                username: input.username,
                ownershipVerificationCode: input.ownershipVerificationCode,
                resetResponse: input.resetResponse,
                persistent,
                productParam: services.productParam,
                ktActivation: await services.getKtActivation(),
                setupVPN: services.setupVPN,
                api,
            });
            telemetry.sendResetPasswordSuccess({
                step: 'setNewPassword',
                method: recoveredWithDevice ? 'device-recovery' : input.ownershipVerificationMethod,
            });
            await services.onLogin(session);
        } catch (error) {
            telemetry.sendResetPasswordFailure({
                step: 'setNewPassword',
                method: input.mnemonicData ? 'mnemonic' : input.ownershipVerificationMethod,
            });
            throw error;
        }
    }),
});

export type ForgotPasswordActors = ReturnType<typeof createForgotPasswordActors>;
