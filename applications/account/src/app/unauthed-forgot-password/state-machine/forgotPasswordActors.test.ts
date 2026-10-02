import { type AnyActorLogic, type InputFrom, type OutputFrom, createActor, toPromise } from 'xstate';

import type { ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { requestLoginResetToken, validateResetToken } from '@proton/shared/lib/api/reset';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import type { Api, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import {
    DeviceRecoveryLevel,
    NoResetMethodsError,
    authMnemonicAndGetKeys,
    getDeviceRecoveryLevel,
    handleRequestRecoveryMethods,
    performPasswordChangeViaMnemonic,
    performPasswordReset,
} from '../actions';
import {
    type ForgotPasswordServices,
    type MnemonicDataWithoutAPI,
    type ResetPasswordInput,
    createForgotPasswordActors,
} from './forgotPasswordActors';

jest.mock('../actions', () => ({
    ...jest.requireActual('../actions'),
    handleRequestRecoveryMethods: jest.fn(),
    authMnemonicAndGetKeys: jest.fn(),
    getDeviceRecoveryLevel: jest.fn(),
    performPasswordReset: jest.fn(),
    performPasswordChangeViaMnemonic: jest.fn(),
}));

const resetResponse = { UserID: 'user-id', UserKeys: [] } as unknown as ValidateResetTokenResponse;
const mnemonicData: MnemonicDataWithoutAPI = { authResponse: {} as AuthResponse, decryptedUserKeys: [] };
const session = { session: 'signed-in' } as unknown as Parameters<ForgotPasswordServices['onLogin']>[0];
const ktActivation = 'kt-activation' as unknown as KeyTransparencyActivation;

/** The app's services, faked, with every call recorded in `calls` so a test can check what ran in which order. */
function makeServices() {
    const calls: string[] = [];
    const record = (name: string) => () => {
        calls.push(name);
    };
    const telemetry = {
        sendResetPasswordPageLoad: jest.fn(),
        sendResetPasswordPageExit: jest.fn(),
        sendResetPasswordStepLoad: jest.fn(),
        sendResetPasswordRecoveryMethodsRequested: jest.fn(record('telemetry')),
        sendResetPasswordCodeSent: jest.fn(record('telemetry')),
        sendResetPasswordMethodValidated: jest.fn(record('telemetry')),
        sendResetPasswordSuccess: jest.fn(record('telemetry')),
        sendResetPasswordFailure: jest.fn(record('telemetry')),
    };
    const services = {
        api: jest.fn(async () => {
            calls.push('api');
            return resetResponse;
        }) as unknown as Api & jest.Mock,
        prepareAttempt: jest.fn(async () => {
            calls.push('prepareAttempt');
        }),
        getPersistent: jest.fn(() => true),
        getKtActivation: jest.fn(async () => ktActivation),
        productParam: 'business' as const,
        setupVPN: true,
        onLogin: jest.fn(async () => {
            calls.push('onLogin');
            return { state: 'complete' as const };
        }),
        telemetry: telemetry as unknown as ForgotPasswordServices['telemetry'],
    } satisfies ForgotPasswordServices;
    return { services, telemetry, calls };
}

/** Runs a request to completion: its output, or its error. */
function run<TLogic extends AnyActorLogic>(logic: TLogic, input: InputFrom<TLogic>): Promise<OutputFrom<TLogic>> {
    return toPromise(createActor(logic, { input }).start());
}

const resetInput = (overrides: Partial<ResetPasswordInput> = {}): ResetPasswordInput => ({
    newPassword: 'new password',
    username: 'user@example.com',
    mnemonicData: undefined,
    resetResponse,
    ownershipVerificationCode: 'reset-token',
    ownershipVerificationMethod: 'email',
    deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
    ...overrides,
});

beforeEach(() => {
    jest.mocked(handleRequestRecoveryMethods).mockReset();
    jest.mocked(authMnemonicAndGetKeys).mockReset().mockResolvedValue(mnemonicData);
    jest.mocked(getDeviceRecoveryLevel).mockReset().mockResolvedValue(DeviceRecoveryLevel.PARTIAL);
    jest.mocked(performPasswordReset).mockReset().mockResolvedValue(session);
    jest.mocked(performPasswordChangeViaMnemonic).mockReset().mockResolvedValue(session);
});

describe('createForgotPasswordActors', () => {
    describe('requestRecoveryMethods', () => {
        const methods = {
            username: 'user@example.com',
            accountType: 'internal' as const,
            redactedEmail: 'u***@example.com',
            redactedPhoneNumber: '+1***5678',
            hasEmergencyContacts: true,
        };

        it('prepares the attempt, then requests the methods, then reports what the account has', async () => {
            const { services, telemetry, calls } = makeServices();
            jest.mocked(handleRequestRecoveryMethods).mockImplementation(async () => {
                calls.push('request');
                return { ...methods, methods: ['email', 'mnemonic'] };
            });

            const output = await run(createForgotPasswordActors(services).requestRecoveryMethods, {
                username: 'user@example.com',
            });

            expect(calls).toEqual(['prepareAttempt', 'request', 'telemetry']);
            expect(handleRequestRecoveryMethods).toHaveBeenCalledWith({
                username: 'user@example.com',
                api: services.api,
            });
            expect(telemetry.sendResetPasswordRecoveryMethodsRequested).toHaveBeenCalledWith({
                hasPasswordResetMethod: true,
                hasDataRecoveryMethod: true,
            });
            expect(output).toEqual({ ...methods, methods: ['email', 'mnemonic'] });
        });

        it.each([
            { found: ['sms'], hasPasswordResetMethod: true, hasDataRecoveryMethod: false },
            { found: ['login'], hasPasswordResetMethod: true, hasDataRecoveryMethod: false },
            { found: ['mnemonic'], hasPasswordResetMethod: false, hasDataRecoveryMethod: true },
        ] as const)(
            'reports $found as a password reset method: $hasPasswordResetMethod, a data recovery method: $hasDataRecoveryMethod',
            async ({ found, hasPasswordResetMethod, hasDataRecoveryMethod }) => {
                const { services, telemetry } = makeServices();
                jest.mocked(handleRequestRecoveryMethods).mockResolvedValue({ ...methods, methods: [...found] });
                await run(createForgotPasswordActors(services).requestRecoveryMethods, {
                    username: 'user@example.com',
                });
                expect(telemetry.sendResetPasswordRecoveryMethodsRequested).toHaveBeenCalledWith({
                    hasPasswordResetMethod,
                    hasDataRecoveryMethod,
                });
            }
        );

        it('treats an account without any method as having none, not as a failure', async () => {
            const { services, telemetry } = makeServices();
            jest.mocked(handleRequestRecoveryMethods).mockRejectedValue(new NoResetMethodsError());

            const output = await run(createForgotPasswordActors(services).requestRecoveryMethods, {
                username: 'user@example.com',
            });

            expect(output).toEqual({
                methods: [],
                username: 'user@example.com',
                redactedEmail: '',
                redactedPhoneNumber: '',
                hasEmergencyContacts: false,
            });
            expect(telemetry.sendResetPasswordRecoveryMethodsRequested).toHaveBeenCalledWith({
                hasPasswordResetMethod: false,
                hasDataRecoveryMethod: false,
            });
        });

        it('fails on any other error, without reporting methods', async () => {
            const { services, telemetry } = makeServices();
            const error = new Error('network');
            jest.mocked(handleRequestRecoveryMethods).mockRejectedValue(error);

            await expect(
                run(createForgotPasswordActors(services).requestRecoveryMethods, { username: 'user@example.com' })
            ).rejects.toBe(error);
            expect(telemetry.sendResetPasswordRecoveryMethodsRequested).not.toHaveBeenCalled();
        });

        it('makes no request when preparing the attempt fails', async () => {
            const { services } = makeServices();
            const error = new Error('worker');
            services.prepareAttempt.mockRejectedValue(error);

            await expect(
                run(createForgotPasswordActors(services).requestRecoveryMethods, { username: 'user@example.com' })
            ).rejects.toBe(error);
            expect(handleRequestRecoveryMethods).not.toHaveBeenCalled();
        });
    });

    describe('validateResetLink', () => {
        it('prepares the attempt, then checks the token, which proves ownership', async () => {
            const { services, telemetry, calls } = makeServices();

            const output = await run(createForgotPasswordActors(services).validateResetLink, {
                username: 'user@example.com',
                token: 'link-token',
            });

            expect(calls).toEqual(['prepareAttempt', 'api', 'telemetry']);
            expect(services.api).toHaveBeenCalledWith(validateResetToken('user@example.com', 'link-token'));
            expect(telemetry.sendResetPasswordMethodValidated).toHaveBeenCalledWith({
                step: 'entry',
                method: 'mnemonic',
            });
            // A link doesn't look for a device recovery file
            expect(getDeviceRecoveryLevel).not.toHaveBeenCalled();
            expect(output).toEqual({
                ownershipVerificationCode: 'link-token',
                resetResponse,
                deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
            });
        });

        it('fails when the token is refused, without reporting it as validated', async () => {
            const { services, telemetry } = makeServices();
            const error = new Error('expired');
            services.api.mockRejectedValue(error);

            await expect(
                run(createForgotPasswordActors(services).validateResetLink, {
                    username: 'user@example.com',
                    token: 'link-token',
                })
            ).rejects.toBe(error);
            expect(telemetry.sendResetPasswordMethodValidated).not.toHaveBeenCalled();
        });
    });

    describe('validateRecoveryLink', () => {
        it('prepares the attempt, then decrypts the keys with the phrase, in the session the user chose', async () => {
            const { services, telemetry, calls } = makeServices();
            jest.mocked(authMnemonicAndGetKeys).mockImplementation(async () => {
                calls.push('authMnemonic');
                return mnemonicData;
            });

            const output = await run(createForgotPasswordActors(services).validateRecoveryLink, {
                username: 'user@example.com',
                mnemonic: 'recovery phrase',
            });

            expect(calls).toEqual(['prepareAttempt', 'authMnemonic', 'telemetry']);
            expect(authMnemonicAndGetKeys).toHaveBeenCalledWith({
                username: 'user@example.com',
                mnemonic: 'recovery phrase',
                persistent: true,
                api: services.api,
            });
            expect(telemetry.sendResetPasswordMethodValidated).toHaveBeenCalledWith({
                step: 'entry',
                method: 'mnemonic',
            });
            expect(output).toBe(mnemonicData);
        });

        it('fails when the phrase is refused, without reporting it as validated', async () => {
            const { services, telemetry } = makeServices();
            const error = new Error('wrong phrase');
            jest.mocked(authMnemonicAndGetKeys).mockRejectedValue(error);

            await expect(
                run(createForgotPasswordActors(services).validateRecoveryLink, {
                    username: 'user@example.com',
                    mnemonic: 'recovery phrase',
                })
            ).rejects.toBe(error);
            expect(telemetry.sendResetPasswordMethodValidated).not.toHaveBeenCalled();
        });
    });

    describe('sendResetCode', () => {
        it.each([
            { method: 'email', Method: 'email' },
            { method: 'sms', Method: 'phone' },
        ] as const)('sends an $method code as Method: $Method, then reports it sent', async ({ method, Method }) => {
            const { services, telemetry, calls } = makeServices();

            await run(createForgotPasswordActors(services).sendResetCode, {
                username: 'user@example.com',
                method,
                step: 'some-step',
            });

            expect(services.api).toHaveBeenCalledWith(requestLoginResetToken({ Username: 'user@example.com', Method }));
            expect(telemetry.sendResetPasswordCodeSent).toHaveBeenCalledWith({ step: 'some-step', method });
            // Codes come after the attempt's first request, which prepared it
            expect(calls).toEqual(['api', 'telemetry']);
        });

        it('fails when the code isn’t sent, without reporting it sent', async () => {
            const { services, telemetry } = makeServices();
            const error = new Error('rate limited');
            services.api.mockRejectedValue(error);

            await expect(
                run(createForgotPasswordActors(services).sendResetCode, {
                    username: 'user@example.com',
                    method: 'email',
                    step: 'verifyRecoveryEmail',
                })
            ).rejects.toBe(error);
            expect(telemetry.sendResetPasswordCodeSent).not.toHaveBeenCalled();
        });
    });

    describe('validateResetCode', () => {
        it('checks the code, then the device recovery file, then reports it validated', async () => {
            const { services, telemetry, calls } = makeServices();
            jest.mocked(getDeviceRecoveryLevel).mockImplementation(async () => {
                calls.push('deviceRecovery');
                return DeviceRecoveryLevel.FULL;
            });

            const output = await run(createForgotPasswordActors(services).validateResetCode, {
                username: 'user@example.com',
                method: 'sms',
                step: 'verifyRecoverySms',
                code: '123456',
            });

            expect(calls).toEqual(['api', 'deviceRecovery', 'telemetry']);
            expect(services.api).toHaveBeenCalledWith(validateResetToken('user@example.com', '123456'));
            expect(getDeviceRecoveryLevel).toHaveBeenCalledWith(resetResponse);
            expect(telemetry.sendResetPasswordMethodValidated).toHaveBeenCalledWith({
                step: 'verifyRecoverySms',
                method: 'sms',
            });
            expect(output).toEqual({
                ownershipVerificationCode: '123456',
                resetResponse,
                deviceRecoveryLevel: DeviceRecoveryLevel.FULL,
            });
        });

        it('fails on a wrong code, without reporting it validated', async () => {
            const { services, telemetry } = makeServices();
            const error = new Error('invalid code');
            services.api.mockRejectedValue(error);

            await expect(
                run(createForgotPasswordActors(services).validateResetCode, {
                    username: 'user@example.com',
                    method: 'email',
                    step: 'verifyRecoveryEmail',
                    code: '000000',
                })
            ).rejects.toBe(error);
            expect(getDeviceRecoveryLevel).not.toHaveBeenCalled();
            expect(telemetry.sendResetPasswordMethodValidated).not.toHaveBeenCalled();
        });
    });

    describe('validatePhrase', () => {
        it('decrypts the keys with the phrase, in the session the user chose, without preparing again', async () => {
            const { services } = makeServices();

            const output = await run(createForgotPasswordActors(services).validatePhrase, {
                username: 'user@example.com',
                mnemonic: 'recovery phrase',
            });

            expect(authMnemonicAndGetKeys).toHaveBeenCalledWith({
                username: 'user@example.com',
                mnemonic: 'recovery phrase',
                persistent: true,
                api: services.api,
            });
            expect(services.prepareAttempt).not.toHaveBeenCalled();
            expect(output).toBe(mnemonicData);
        });
    });

    describe('resetPassword', () => {
        it('with the recovery phrase’s keys, changes the password with them and signs in', async () => {
            const { services, telemetry, calls } = makeServices();

            // The phrase wins over a reset token the flow also has
            await run(createForgotPasswordActors(services).resetPassword, resetInput({ mnemonicData }));

            expect(performPasswordChangeViaMnemonic).toHaveBeenCalledWith({
                newPassword: 'new password',
                mnemonicData: { ...mnemonicData, api: services.api },
                persistent: true,
                api: services.api,
            });
            expect(performPasswordReset).not.toHaveBeenCalled();
            expect(telemetry.sendResetPasswordSuccess).toHaveBeenCalledWith({
                step: 'setNewPassword',
                method: 'mnemonic',
            });
            expect(services.onLogin).toHaveBeenCalledWith(session);
            expect(calls).toEqual(['telemetry', 'onLogin']);
        });

        it('with a reset token, resets the password with the app’s settings and signs in', async () => {
            const { services, telemetry, calls } = makeServices();

            await run(
                createForgotPasswordActors(services).resetPassword,
                resetInput({ ownershipVerificationMethod: 'sms' })
            );

            expect(performPasswordReset).toHaveBeenCalledWith({
                newPassword: 'new password',
                username: 'user@example.com',
                ownershipVerificationCode: 'reset-token',
                resetResponse,
                persistent: true,
                productParam: 'business',
                ktActivation,
                setupVPN: true,
                api: services.api,
            });
            expect(performPasswordChangeViaMnemonic).not.toHaveBeenCalled();
            expect(telemetry.sendResetPasswordSuccess).toHaveBeenCalledWith({
                step: 'setNewPassword',
                method: 'sms',
            });
            expect(services.onLogin).toHaveBeenCalledWith(session);
            expect(calls).toEqual(['telemetry', 'onLogin']);
        });

        it('reports a reset with a full device recovery as a device recovery', async () => {
            const { services, telemetry } = makeServices();
            await run(
                createForgotPasswordActors(services).resetPassword,
                resetInput({ deviceRecoveryLevel: DeviceRecoveryLevel.FULL })
            );
            expect(telemetry.sendResetPasswordSuccess).toHaveBeenCalledWith({
                step: 'setNewPassword',
                method: 'device-recovery',
            });
        });

        it('fails without a reset token or keys, and reports the failure', async () => {
            const { services, telemetry } = makeServices();

            await expect(
                run(createForgotPasswordActors(services).resetPassword, resetInput({ resetResponse: undefined }))
            ).rejects.toThrow('Missing reset token');
            expect(performPasswordReset).not.toHaveBeenCalled();
            expect(telemetry.sendResetPasswordFailure).toHaveBeenCalledWith({
                step: 'setNewPassword',
                method: 'email',
            });
            expect(services.onLogin).not.toHaveBeenCalled();
        });

        it.each([
            { recovered: 'a reset token', input: resetInput(), method: 'email', reset: performPasswordReset },
            {
                recovered: 'the recovery phrase’s keys',
                input: resetInput({ mnemonicData }),
                method: 'mnemonic',
                reset: performPasswordChangeViaMnemonic,
            },
        ])('reports a failed reset with $recovered, without signing in', async ({ input, method, reset }) => {
            const { services, telemetry } = makeServices();
            const error = new Error('reset failed');
            jest.mocked(reset).mockRejectedValue(error);

            await expect(run(createForgotPasswordActors(services).resetPassword, input)).rejects.toBe(error);
            expect(telemetry.sendResetPasswordSuccess).not.toHaveBeenCalled();
            expect(telemetry.sendResetPasswordFailure).toHaveBeenCalledWith({ step: 'setNewPassword', method });
            expect(services.onLogin).not.toHaveBeenCalled();
        });

        it('reports signing in after the reset failing as a failure too', async () => {
            const { services, telemetry } = makeServices();
            const error = new Error('sign-in failed');
            services.onLogin.mockRejectedValue(error);

            await expect(run(createForgotPasswordActors(services).resetPassword, resetInput())).rejects.toBe(error);
            expect(telemetry.sendResetPasswordFailure).toHaveBeenCalledWith({
                step: 'setNewPassword',
                method: 'email',
            });
        });
    });
});
