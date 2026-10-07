import { type AnyActorLogic, createActor, fromPromise, waitFor } from 'xstate';
import type { StateValue } from 'xstate';

import type {
    DelegatedAccessSummary,
    ExistingSession,
    RecoveryMethod,
    ValidateResetTokenResponse,
} from '@proton/shared/lib/api/reset';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { DeviceRecoveryLevel } from '../actions';
import {
    type UnauthedForgotPasswordMachineEmitted,
    UnauthedForgotPasswordStateMachine,
    UnauthedForgotPasswordStateMachineTags,
    selectCanGoBack,
} from './UnauthedForgotPasswordStateMachine';
import type {
    CodeInput,
    ForgotPasswordActors,
    MnemonicDataWithoutAPI,
    OwnershipProof,
    ResetPasswordInput,
} from './forgotPasswordActors';
import {
    InvalidResetCodeError,
    NoKeysDecryptedUsingPhraseError,
    ResetKeysRejectedError,
    ResetMethodNotAllowedError,
    ResetTokenRejectedError,
    SignInAfterResetError,
} from './forgotPasswordErrors';

function makeResetResponse(
    overrides: { Sessions?: ExistingSession[]; DelegatedAccesses?: DelegatedAccessSummary[] } = {}
): ValidateResetTokenResponse {
    return {
        Sessions: [],
        DelegatedAccesses: [],
        ...overrides,
    } as unknown as ValidateResetTokenResponse;
}

function makeOwnershipProof(
    overrides: {
        deviceRecoveryLevel?: DeviceRecoveryLevel;
        resetResponse?: ValidateResetTokenResponse;
        ownershipVerificationCode?: string;
    } = {}
): OwnershipProof {
    return {
        ownershipVerificationCode: 'token-abc',
        resetResponse: makeResetResponse(),
        deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
        ...overrides,
    };
}

function makeContact(types: number): DelegatedAccessSummary {
    return { Types: types } as unknown as DelegatedAccessSummary;
}

const socialContact = () => makeContact(DelegatedAccessTypeEnum.SocialRecovery);
const emergencyContact = () => makeContact(DelegatedAccessTypeEnum.EmergencyAccess);

const mnemonicData: MnemonicDataWithoutAPI = { authResponse: {} as AuthResponse, decryptedUserKeys: [] };

const apiError = (code: number) => ({ data: { Code: code, Error: `error ${code}` } });

/** How the requests fail in the ways the machine acts on (`forgotPasswordErrors`). */
const methodNotAllowed = () => new ResetMethodNotAllowedError(apiError(API_CUSTOM_ERROR_CODES.NOT_ALLOWED));
const invalidCode = () => new InvalidResetCodeError(apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE));
const resetTokenRejected = () => new ResetTokenRejectedError(apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE));
const resetKeysRejected = () => new ResetKeysRejectedError(apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE));

/** The account the fake requests answer for, and what they were asked; each test sets it up as it goes. */
interface Harness {
    methods: RecoveryMethod[];
    hasEmergencyContacts: boolean;
    /** What proving ownership (with a code or a reset link) unlocks. */
    proof: OwnershipProof;
    sentCodes: CodeInput[];
    resets: ResetPasswordInput[];
    emitted: UnauthedForgotPasswordMachineEmitted[];
    /** Each time the machine left for the sign-in page, with its username then, which the sign-in form starts with. */
    signInRedirects: string[];
}

const harnesses = new WeakMap<object, Harness>();

function startActor(overrides: Partial<Record<keyof ForgotPasswordActors, AnyActorLogic>> = {}) {
    const harness: Harness = {
        methods: [],
        hasEmergencyContacts: false,
        proof: makeOwnershipProof(),
        sentCodes: [],
        resets: [],
        emitted: [],
        signInRedirects: [],
    };
    const machine = UnauthedForgotPasswordStateMachine.provide({
        actions: {
            redirectToSignIn: ({ context }) => {
                harness.signInRedirects.push(context.username);
            },
        },
        actors: {
            requestRecoveryMethods: fromPromise(async ({ input }: { input: { username: string } }) => ({
                methods: harness.methods,
                username: input.username,
                redactedEmail: 'u***@example.com',
                redactedPhoneNumber: '+1***5678',
                hasEmergencyContacts: harness.hasEmergencyContacts,
            })),
            validateResetLink: fromPromise(async ({ input }: { input: { token: string } }) => ({
                ...harness.proof,
                ownershipVerificationCode: input.token,
            })),
            validateRecoveryLink: fromPromise(async () => mnemonicData),
            sendResetCode: fromPromise(async ({ input }: { input: CodeInput }) => {
                harness.sentCodes.push(input);
            }),
            validateResetCode: fromPromise(async () => harness.proof),
            validatePhrase: fromPromise(async () => mnemonicData),
            resetPassword: fromPromise(async ({ input }: { input: ResetPasswordInput }) => {
                harness.resets.push(input);
            }),
            ...overrides,
        } as NonNullable<Parameters<typeof UnauthedForgotPasswordStateMachine.provide>[0]['actors']>,
    });
    const actor = createActor(machine);
    actor.on('*', (event) => harness.emitted.push(event));
    harnesses.set(actor, harness);
    return actor.start();
}

type ForgotPasswordActor = ReturnType<typeof startActor>;

const harnessOf = (actor: ForgotPasswordActor) => harnesses.get(actor)!;

const errors = (actor: ForgotPasswordActor) =>
    harnessOf(actor).emitted.flatMap((event) => (event.type === 'error' ? [event.error] : []));

function waitForState(actor: ForgotPasswordActor, state: StateValue) {
    return waitFor(actor, (snap) => snap.matches(state as any), { timeout: 1_000 });
}

/** Until the requests the machine started have settled. */
function waitUntilSettled(actor: ForgotPasswordActor) {
    return waitFor(
        actor,
        (snap) =>
            !snap.hasTag(UnauthedForgotPasswordStateMachineTags.submitting) &&
            // Sending the email code isn't shown as a request
            !snap.matches({ verifyRecoveryEmail: 'sendingCode' }) &&
            !snap.hasTag(UnauthedForgotPasswordStateMachineTags.resending),
        { timeout: 1_000 }
    );
}

/** The user asks to recover an account with these recovery methods, and the request settles. */
function sendRecoveryStarted(
    actor: ForgotPasswordActor,
    methods: RecoveryMethod[] = [],
    extras: { hasEmergencyContacts?: boolean } = {}
) {
    const harness = harnessOf(actor);
    harness.methods = methods;
    harness.hasEmergencyContacts = extras.hasEmergencyContacts ?? false;
    actor.send({ type: 'username.submitted', payload: { username: 'user@example.com' } });
    return waitUntilSettled(actor);
}

/** Starts recovery with these methods; the machine routes to the first one. */
const startRecoveryWith = sendRecoveryStarted;

/** The user enters a code that proves ownership and unlocks this. */
function submitCode(actor: ForgotPasswordActor, proof: OwnershipProof = makeOwnershipProof()) {
    harnessOf(actor).proof = proof;
    actor.send({ type: 'code.submitted', payload: { code: proof.ownershipVerificationCode } });
    return waitUntilSettled(actor);
}

/** The user asks for the code on the recovery phone. */
function requestSmsCode(actor: ForgotPasswordActor) {
    actor.send({ type: 'code.requested' });
    return waitUntilSettled(actor);
}

/** The user enters their recovery phrase, which decrypts the keys. */
function submitPhrase(actor: ForgotPasswordActor) {
    actor.send({ type: 'phrase.submitted', payload: { mnemonic: 'recovery phrase' } });
    return waitUntilSettled(actor);
}

async function navigateToVerifyRecoveryEmail(actor: ForgotPasswordActor) {
    await startRecoveryWith(actor, ['email']);
}

async function navigateToEnterRecoverySms(actor: ForgotPasswordActor) {
    await startRecoveryWith(actor, ['sms']);
}

async function navigateToVerifyRecoverySms(actor: ForgotPasswordActor) {
    await navigateToEnterRecoverySms(actor);
    await requestSmsCode(actor);
}

/** Verified by email, for an account that also has a recovery phrase. */
async function verifyByEmail(
    actor: ForgotPasswordActor,
    deviceRecoveryLevel: DeviceRecoveryLevel,
    resetResponse = makeResetResponse()
) {
    await sendRecoveryStarted(actor, ['email', 'mnemonic']);
    return submitCode(actor, makeOwnershipProof({ deviceRecoveryLevel, resetResponse }));
}

async function navigateToAuthenticatedRecovery(actor: ForgotPasswordActor, resetResponse = makeResetResponse()) {
    await sendRecoveryStarted(actor, ['email', 'mnemonic']);
    await submitCode(actor, makeOwnershipProof({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse }));
    await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
    actor.send({ type: 'decision.skip' });
    return actor.getSnapshot();
}

/** Verified by email, for an account without a recovery phrase: the phrase step is never offered. */
async function navigateToAuthenticatedRecoveryWithoutMnemonic(
    actor: ForgotPasswordActor,
    resetResponse: ValidateResetTokenResponse
) {
    await sendRecoveryStarted(actor, ['email']);
    await submitCode(actor, makeOwnershipProof({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse }));
}

/** Ownership proven, no recovery phrase used, no other sessions or contacts: the data-loss offer. */
function navigateToDataLossOffer(actor: ForgotPasswordActor) {
    return navigateToAuthenticatedRecovery(actor, makeResetResponse());
}

async function navigateToUnauthenticatedRecovery(
    actor: ForgotPasswordActor,
    extras: { hasEmergencyContacts?: boolean } = {}
) {
    await startRecoveryWith(actor, [], extras);
    return waitForState(actor, { unauthenticatedRecovery: 'otherSessionsPrompt' });
}

describe('UnauthedForgotPasswordStateMachine', () => {
    describe('initial state', () => {
        it('starts in entry', () => {
            expect(startActor().getSnapshot().matches('entry')).toBe(true);
        });

        it('entry state has hideReturnToSignIn tag', () => {
            expect(startActor().getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn)).toBe(
                true
            );
        });
    });

    describe('entry', () => {
        it('username.submitted → the first recovery method, and assigns context', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email']);
            const snap = actor.getSnapshot();
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
            expect(snap.context.recoveryMethods).toEqual(['email']);
            expect(snap.context.username).toBe('user@example.com');
            expect(snap.context.redactedRecoveryEmail).toBe('u***@example.com');
        });

        it('shows the recovery methods request loading, on the entry step', () => {
            const actor = startActor({ requestRecoveryMethods: fromPromise(() => new Promise(() => {})) });
            actor.send({ type: 'username.submitted', payload: { username: 'user@example.com' } });
            const snap = actor.getSnapshot();
            expect(snap.matches('entry')).toBe(true);
            expect(snap.hasTag(UnauthedForgotPasswordStateMachineTags.submitting)).toBe(true);
        });

        it('shows a failed recovery methods request, and stays on the entry step', async () => {
            const error = new Error('network');
            const actor = startActor({ requestRecoveryMethods: fromPromise(() => Promise.reject(error)) });
            actor.send({ type: 'username.submitted', payload: { username: 'user@example.com' } });
            await waitUntilSettled(actor);
            expect(actor.getSnapshot().matches({ entry: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
        });

        it('recoveryLink.opened → checks the phrase, then setNewPassword with username + mnemonicData', async () => {
            const actor = startActor();
            actor.send({
                type: 'recoveryLink.opened',
                payload: { username: 'prefilled@example.com', mnemonic: 'recovery phrase' },
            });
            const snap = await waitUntilSettled(actor);
            expect(snap.matches('setNewPassword')).toBe(true);
            expect(snap.context.username).toBe('prefilled@example.com');
            expect(snap.context.mnemonicData).toBe(mnemonicData);
        });

        it('username.prefilled → stays in entry and updates username', () => {
            const actor = startActor();
            actor.send({ type: 'username.prefilled', payload: { username: 'new@example.com' } });
            const snap = actor.getSnapshot();
            expect(snap.matches('entry')).toBe(true);
            expect(snap.context.username).toBe('new@example.com');
        });

        it('resetLink.opened → checks the token, then setNewPassword with the token context', async () => {
            const actor = startActor();
            harnessOf(actor).proof = makeOwnershipProof({
                resetResponse: makeResetResponse({ DelegatedAccesses: [socialContact()] }),
            });
            actor.send({ type: 'resetLink.opened', payload: { username: 'token@example.com', token: 'tok-xyz' } });
            const snap = await waitUntilSettled(actor);
            expect(snap.matches('setNewPassword')).toBe(true);
            expect(snap.context.username).toBe('token@example.com');
            expect(snap.context.ownershipVerificationCode).toBe('tok-xyz');
            expect(snap.context.ownershipVerificationMethod).toBe('mnemonic');
            expect(snap.context.delegatedAccessContacts).toHaveLength(1);
        });

        it('shows a reset link that failed its check, and stays on the entry step', async () => {
            const error = new Error('expired');
            const actor = startActor({ validateResetLink: fromPromise(() => Promise.reject(error)) });
            actor.send({ type: 'resetLink.opened', payload: { username: 'token@example.com', token: 'tok-xyz' } });
            await waitUntilSettled(actor);
            expect(actor.getSnapshot().matches({ entry: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
        });

        it('shows a recovery link that failed its check, and stays on the entry step', async () => {
            const error = new Error('wrong phrase');
            const actor = startActor({ validateRecoveryLink: fromPromise(() => Promise.reject(error)) });
            actor.send({ type: 'recoveryLink.opened', payload: { username: 'u@example.com', mnemonic: 'phrase' } });
            await waitUntilSettled(actor);
            expect(actor.getSnapshot().matches({ entry: 'idle' })).toBe(true);
            expect(actor.getSnapshot().context.mnemonicData).toBeUndefined();
            expect(errors(actor)).toEqual([error]);
        });
    });

    describe('routeRecoveryMethod', () => {
        it('email available → verifyRecoveryEmail', async () => {
            const actor = startActor();
            const snap = await startRecoveryWith(actor, ['email']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('sms available (no email) → enterRecoverySms', async () => {
            const actor = startActor();
            const snap = await startRecoveryWith(actor, ['sms']);
            expect(snap.matches('enterRecoverySms')).toBe(true);
        });

        it('no email/sms → mnemonicRecovery.enterPhrase', async () => {
            const actor = startActor();
            const snap = await startRecoveryWith(actor, ['mnemonic']);
            expect(snap.matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });
    });

    describe('verifyRecoveryEmail', () => {
        it('a valid code → routes on, and assigns ownership context', async () => {
            const actor = startActor();
            await navigateToVerifyRecoveryEmail(actor);
            const resetResponse = makeResetResponse({ DelegatedAccesses: [emergencyContact()] });
            await submitCode(
                actor,
                makeOwnershipProof({ resetResponse, deviceRecoveryLevel: DeviceRecoveryLevel.PARTIAL })
            );
            const snap = actor.getSnapshot();
            // No phrase, no other sessions, an emergency contact
            expect(snap.matches({ authenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
            expect(snap.context.ownershipVerificationMethod).toBe('email');
            expect(snap.context.ownershipVerificationCode).toBe('token-abc');
            expect(snap.context.deviceRecoveryLevel).toBe(DeviceRecoveryLevel.PARTIAL);
            expect(snap.context.delegatedAccessContacts).toHaveLength(1);
        });

        it('decision.back → entry', async () => {
            const actor = startActor();
            await navigateToVerifyRecoveryEmail(actor);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('decision.skip → the SMS step, the next method', async () => {
            const actor = startActor();
            await startRecoveryWith(actor, ['email', 'sms']);
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
        });

        it('decision.skip without SMS → the phrase step', async () => {
            const actor = startActor();
            await startRecoveryWith(actor, ['email', 'mnemonic']);
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });
    });

    describe('enterRecoverySms', () => {
        it('code.requested → sends the code, then verifyRecoverySms', async () => {
            const actor = startActor();
            await navigateToEnterRecoverySms(actor);
            await requestSmsCode(actor);
            expect(actor.getSnapshot().matches('verifyRecoverySms')).toBe(true);
        });

        it('decision.back → entry', async () => {
            const actor = startActor();
            await navigateToEnterRecoverySms(actor);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('decision.skip → the next method', async () => {
            const actor = startActor();
            await navigateToEnterRecoverySms(actor);
            actor.send({ type: 'decision.skip' });
            // No other method: the other ways to recover
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('verifyRecoverySms', () => {
        it('a valid code → routes on, and assigns ownership context', async () => {
            const actor = startActor();
            await navigateToVerifyRecoverySms(actor);
            await submitCode(actor, makeOwnershipProof({ deviceRecoveryLevel: DeviceRecoveryLevel.FULL }));
            const snap = actor.getSnapshot();
            // The device recovery file recovers the data
            expect(snap.matches('setNewPassword')).toBe(true);
            expect(snap.context.ownershipVerificationMethod).toBe('sms');
            expect(snap.context.deviceRecoveryLevel).toBe(DeviceRecoveryLevel.FULL);
        });

        it('decision.back → enterRecoverySms', async () => {
            const actor = startActor();
            await navigateToVerifyRecoverySms(actor);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
        });

        it('decision.skip → the next method', async () => {
            const actor = startActor();
            await navigateToVerifyRecoverySms(actor);
            actor.send({ type: 'decision.skip' });
            // No other method: the other ways to recover
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('routeDeviceRecovery', () => {
        it('FULL device recovery → setNewPassword', async () => {
            const actor = startActor();
            const snap = await verifyByEmail(actor, DeviceRecoveryLevel.FULL);
            expect(snap.matches('setNewPassword')).toBe(true);
        });

        it('PARTIAL device recovery → mnemonicRecovery.enterPhrase', async () => {
            const actor = startActor();
            const snap = await verifyByEmail(actor, DeviceRecoveryLevel.PARTIAL);
            expect(snap.matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('NONE device recovery → mnemonicRecovery.enterPhrase', async () => {
            const actor = startActor();
            const snap = await verifyByEmail(actor, DeviceRecoveryLevel.NONE);
            expect(snap.matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });
    });

    describe('mnemonicRecovery.routeMnemonic', () => {
        it('mnemonic available → enterPhrase', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['mnemonic']);
            const snap = await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            expect(snap.matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('no mnemonic + has resetResponse → authenticatedRecovery', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const actor = startActor();
            const resetResponse = makeResetResponse({ Sessions: sessions });
            await sendRecoveryStarted(actor, ['email']);
            await submitCode(
                actor,
                makeOwnershipProof({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse })
            );
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('no mnemonic + no resetResponse → unauthenticatedRecovery', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, []);
            const snap = await waitForState(actor, { unauthenticatedRecovery: 'otherSessionsPrompt' });
            expect(snap.matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('mnemonicRecovery.enterPhrase', () => {
        it('a valid phrase → confirmPhrase and stores mnemonicData', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            await submitPhrase(actor);
            const snap = actor.getSnapshot();
            expect(snap.matches({ mnemonicRecovery: 'confirmPhrase' })).toBe(true);
            expect(snap.context.mnemonicData).toBe(mnemonicData);
        });

        // Without an earlier method; "navigation sequences" covers going back after skipping email or SMS to get here
        it('decision.back → entry', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('decision.skip with resetResponse → authenticatedRecovery', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email', 'mnemonic']);
            await submitCode(
                actor,
                makeOwnershipProof({
                    deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
                    resetResponse: makeResetResponse({ Sessions: sessions }),
                })
            );
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('decision.skip without resetResponse → unauthenticatedRecovery', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.skip' });
            const snap = actor.getSnapshot();
            expect(snap.matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('mnemonicRecovery.confirmPhrase', () => {
        it('decision.confirm → setNewPassword', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            await submitPhrase(actor);
            actor.send({ type: 'decision.confirm' });
            expect(actor.getSnapshot().matches('setNewPassword')).toBe(true);
        });
    });

    describe('authenticatedRecovery.routeOtherSessions', () => {
        it('sessions present → otherSessionsPrompt', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            const snap = await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            expect(snap.matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('no sessions → skips otherSessionsPrompt and routes to the delegated access offers', async () => {
            const actor = startActor();
            await navigateToDataLossOffer(actor);
            expect(actor.getSnapshot().matches('offerDataLossReset')).toBe(true);
        });
    });

    describe('authenticatedRecovery.otherSessionsPrompt', () => {
        async function navigateToOtherSessionsPrompt() {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            return actor;
        }

        it('decision.yes → activeSessionInstructions', async () => {
            const actor = await navigateToOtherSessionsPrompt();
            actor.send({ type: 'decision.yes' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'activeSessionInstructions' })).toBe(true);
        });

        it('decision.no → the delegated access offers', async () => {
            const actor = await navigateToOtherSessionsPrompt();
            actor.send({ type: 'decision.no' });
            // No contacts here: the data-loss reset is all that is left
            expect(actor.getSnapshot().matches('offerDataLossReset')).toBe(true);
        });

        it('decision.back with mnemonic → mnemonicRecovery.enterPhrase', async () => {
            const actor = await navigateToOtherSessionsPrompt();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('decision.back without mnemonic → entry', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email']);
            await submitCode(
                actor,
                makeOwnershipProof({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse })
            );
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });
    });

    describe('authenticatedRecovery.activeSessionInstructions', () => {
        async function navigateToActiveSessionInstructions() {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            actor.send({ type: 'decision.yes' });
            return actor;
        }

        it('decision.skip → the delegated access offers', async () => {
            const actor = await navigateToActiveSessionInstructions();
            actor.send({ type: 'decision.skip' });
            // No contacts here: the data-loss reset is all that is left
            expect(actor.getSnapshot().matches('offerDataLossReset')).toBe(true);
        });

        it('decision.back → otherSessionsPrompt', async () => {
            const actor = await navigateToActiveSessionInstructions();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('authenticatedRecovery.routeDelegatedAccess', () => {
        it('social contacts available → socialRecoveryOffer', async () => {
            const resetResponse = makeResetResponse({ DelegatedAccesses: [socialContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            const snap = await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            expect(snap.matches({ authenticatedRecovery: 'socialRecoveryOffer' })).toBe(true);
        });

        it('only emergency contacts → emergencyAccessOffer', async () => {
            const resetResponse = makeResetResponse({ DelegatedAccesses: [emergencyContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            const snap = await waitForState(actor, { authenticatedRecovery: 'emergencyAccessOffer' });
            expect(snap.matches({ authenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('no contacts → offerDataLossReset', async () => {
            const actor = startActor();
            const snap = await navigateToDataLossOffer(actor);
            expect(snap.matches('offerDataLossReset')).toBe(true);
        });
    });

    describe('authenticatedRecovery.socialRecoveryOffer', () => {
        async function navigateToSocialRecoveryOffer() {
            const resetResponse = makeResetResponse({ DelegatedAccesses: [socialContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            return actor;
        }

        it('socialRecovery.started → setNewPassword', async () => {
            const actor = await navigateToSocialRecoveryOffer();
            actor.send({ type: 'socialRecovery.started' });
            expect(actor.getSnapshot().matches('setNewPassword')).toBe(true);
        });

        it('decision.back with mnemonic → mnemonicRecovery.enterPhrase', async () => {
            const actor = await navigateToSocialRecoveryOffer();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('decision.back without mnemonic → entry', async () => {
            const actor = startActor();
            await navigateToAuthenticatedRecoveryWithoutMnemonic(
                actor,
                makeResetResponse({ DelegatedAccesses: [socialContact()] })
            );
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('decision.back with signed-in sessions → otherSessionsPrompt', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions, DelegatedAccesses: [socialContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            actor.send({ type: 'decision.no' });
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('decision.skip with emergency contacts → emergencyAccessOffer', async () => {
            const resetResponse = makeResetResponse({
                DelegatedAccesses: [socialContact(), emergencyContact()],
            });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            actor.send({ type: 'decision.skip' });
            const snap = await waitForState(actor, { authenticatedRecovery: 'emergencyAccessOffer' });
            expect(snap.matches({ authenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('decision.skip without emergency contacts → offerDataLossReset', async () => {
            const actor = await navigateToSocialRecoveryOffer();
            actor.send({ type: 'decision.skip' });
            const snap = await waitForState(actor, 'offerDataLossReset');
            expect(snap.matches('offerDataLossReset')).toBe(true);
        });
    });

    describe('authenticatedRecovery.emergencyAccessOffer', () => {
        async function navigateToAuthenticatedEmergencyOffer() {
            const resetResponse = makeResetResponse({ DelegatedAccesses: [emergencyContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'emergencyAccessOffer' });
            return actor;
        }

        it('decision.yes → unauthenticatedRecovery.emergencyContactInstructions', async () => {
            const actor = await navigateToAuthenticatedEmergencyOffer();
            actor.send({ type: 'decision.yes' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyContactInstructions' })).toBe(true);
        });

        it('decision.back with mnemonic → mnemonicRecovery.enterPhrase', async () => {
            const actor = await navigateToAuthenticatedEmergencyOffer();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('decision.back without mnemonic → entry', async () => {
            const actor = startActor();
            await navigateToAuthenticatedRecoveryWithoutMnemonic(
                actor,
                makeResetResponse({ DelegatedAccesses: [emergencyContact()] })
            );
            await waitForState(actor, { authenticatedRecovery: 'emergencyAccessOffer' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('decision.back with social contacts → socialRecoveryOffer', async () => {
            const resetResponse = makeResetResponse({ DelegatedAccesses: [socialContact(), emergencyContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'socialRecoveryOffer' })).toBe(true);
        });

        it('decision.back with signed-in sessions → otherSessionsPrompt', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions, DelegatedAccesses: [emergencyContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            actor.send({ type: 'decision.no' });
            await waitForState(actor, { authenticatedRecovery: 'emergencyAccessOffer' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('decision.no → offerDataLossReset', async () => {
            const actor = await navigateToAuthenticatedEmergencyOffer();
            actor.send({ type: 'decision.no' });
            const snap = await waitForState(actor, 'offerDataLossReset');
            expect(snap.matches('offerDataLossReset')).toBe(true);
        });
    });

    describe('unauthenticatedRecovery.otherSessionsPrompt', () => {
        it('decision.yes → activeSessionInstructions', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor);
            actor.send({ type: 'decision.yes' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'activeSessionInstructions' })).toBe(true);
        });

        it('decision.no with emergencyContacts → emergencyAccessOffer', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: true });
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('decision.no without emergencyContacts → recoveryFailed', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: false });
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
        });

        it('decision.back → entry', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });
    });

    describe('unauthenticatedRecovery.activeSessionInstructions', () => {
        async function navigateToUnauthActiveSession(extras: { hasEmergencyContacts?: boolean } = {}) {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, extras);
            actor.send({ type: 'decision.yes' });
            return actor;
        }

        it('decision.skip with emergencyContacts → emergencyAccessOffer', async () => {
            const actor = await navigateToUnauthActiveSession({ hasEmergencyContacts: true });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('decision.skip without emergencyContacts → recoveryFailed', async () => {
            const actor = await navigateToUnauthActiveSession({ hasEmergencyContacts: false });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
        });

        it('decision.back → otherSessionsPrompt', async () => {
            const actor = await navigateToUnauthActiveSession();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('unauthenticatedRecovery.emergencyAccessOffer', () => {
        async function navigateToUnauthEmergencyOffer() {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: true });
            actor.send({ type: 'decision.no' });
            return actor;
        }

        it('decision.yes → emergencyContactInstructions', async () => {
            const actor = await navigateToUnauthEmergencyOffer();
            actor.send({ type: 'decision.yes' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyContactInstructions' })).toBe(true);
        });

        it('decision.no → recoveryFailed', async () => {
            const actor = await navigateToUnauthEmergencyOffer();
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
        });

        it('decision.back → otherSessionsPrompt', async () => {
            const actor = await navigateToUnauthEmergencyOffer();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('unauthenticatedRecovery.emergencyContactInstructions', () => {
        async function navigateToEmergencyInstructions(withResetResponse = false) {
            const actor = startActor();
            if (withResetResponse) {
                const resetResponse = makeResetResponse({ DelegatedAccesses: [emergencyContact()] });
                await navigateToAuthenticatedRecovery(actor, resetResponse);
                await waitForState(actor, { authenticatedRecovery: 'emergencyAccessOffer' });
                actor.send({ type: 'decision.yes' });
            } else {
                await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: true });
                actor.send({ type: 'decision.no' });
                actor.send({ type: 'decision.yes' });
            }
            await waitForState(actor, { unauthenticatedRecovery: 'emergencyContactInstructions' });
            return actor;
        }

        it('decision.skip with resetResponse → offerDataLossReset', async () => {
            const actor = await navigateToEmergencyInstructions(true);
            actor.send({ type: 'decision.skip' });
            const snap = await waitForState(actor, 'offerDataLossReset');
            expect(snap.matches('offerDataLossReset')).toBe(true);
        });

        it('decision.skip without resetResponse → recoveryFailed', async () => {
            const actor = await navigateToEmergencyInstructions(false);
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
        });

        it('decision.back with resetResponse → authenticatedRecovery.emergencyAccessOffer', async () => {
            const actor = await navigateToEmergencyInstructions(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('decision.back without resetResponse → unauthenticatedRecovery.emergencyAccessOffer', async () => {
            const actor = await navigateToEmergencyInstructions(false);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });
    });

    describe('offerDataLossReset', () => {
        it('decision.yes → setNewPassword with resetWithDataLoss = true', async () => {
            const actor = startActor();
            await navigateToDataLossOffer(actor);
            actor.send({ type: 'decision.yes' });
            const snap = actor.getSnapshot();
            expect(snap.matches('setNewPassword')).toBe(true);
            expect(snap.context.resetWithDataLoss).toBe(true);
        });

        it('decision.skip → recoveryFailed', async () => {
            const actor = startActor();
            await navigateToDataLossOffer(actor);
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
        });

        it('decision.back with emergency contacts → authenticatedRecovery.emergencyAccessOffer', async () => {
            const resetResponse = makeResetResponse({ DelegatedAccesses: [socialContact(), emergencyContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            actor.send({ type: 'decision.skip' });
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches('offerDataLossReset')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('decision.back with social contacts → authenticatedRecovery.socialRecoveryOffer', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions, DelegatedAccesses: [socialContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            actor.send({ type: 'decision.no' });
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('offerDataLossReset')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'socialRecoveryOffer' })).toBe(true);
        });

        it('decision.back with signed-in sessions → authenticatedRecovery.otherSessionsPrompt', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, makeResetResponse({ Sessions: sessions }));
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            actor.send({ type: 'decision.no' });
            await waitForState(actor, 'offerDataLossReset');
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('decision.back with mnemonic → mnemonicRecovery.enterPhrase', async () => {
            const actor = startActor();
            await navigateToDataLossOffer(actor);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('decision.back without mnemonic → entry', async () => {
            const actor = startActor();
            await navigateToAuthenticatedRecoveryWithoutMnemonic(actor, makeResetResponse());
            await waitForState(actor, 'offerDataLossReset');
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });
    });

    describe('recoveryFailed', () => {
        it('decision.back after declining the data-loss reset → offerDataLossReset', async () => {
            // With an emergency contact, so proven ownership has to come before the unauthenticated steps
            const resetResponse = makeResetResponse({ DelegatedAccesses: [emergencyContact()] });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            await waitForState(actor, { authenticatedRecovery: 'emergencyAccessOffer' });
            actor.send({ type: 'decision.no' });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('offerDataLossReset')).toBe(true);
            // The offer goes back too, so the page's back button stays, and keeps the focus
            expect(actor.getSnapshot().can({ type: 'decision.back' })).toBe(true);
        });

        it('decision.back after declining emergency access → unauthenticatedRecovery.emergencyAccessOffer', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: true });
            actor.send({ type: 'decision.no' });
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('decision.back after the emergency contact instructions → unauthenticatedRecovery.emergencyContactInstructions', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: true });
            actor.send({ type: 'decision.no' });
            actor.send({ type: 'decision.yes' });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyContactInstructions' })).toBe(true);
        });

        it('decision.back after declining the sessions prompt → unauthenticatedRecovery.otherSessionsPrompt', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: false });
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('decision.back after the signed-in session instructions → unauthenticatedRecovery.activeSessionInstructions', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor, { hasEmergencyContacts: false });
            actor.send({ type: 'decision.yes' });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'activeSessionInstructions' })).toBe(true);
        });
    });

    describe('leaving for sign-in', () => {
        it('back from the first step leaves with the last username the user gave', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email']);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(harnessOf(actor).signInRedirects).toEqual(['user@example.com']);
        });

        it('the error step leaves with the username the user gave', async () => {
            const actor = startActor({ sendResetCode: fromPromise(() => Promise.reject(methodNotAllowed())) });
            await navigateToVerifyRecoveryEmail(actor);
            expect(actor.getSnapshot().matches('recoveryMethodVerificationError')).toBe(true);

            actor.send({ type: 'decision.skip' });
            expect(harnessOf(actor).signInRedirects).toEqual(['user@example.com']);
        });
    });

    describe('hideReturnToSignIn tag', () => {
        it('is present on entry', () => {
            const actor = startActor();
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn)).toBe(true);
        });

        it('is present on setNewPassword', async () => {
            const actor = startActor();
            actor.send({ type: 'recoveryLink.opened', payload: { username: 'u@example.com', mnemonic: 'phrase' } });
            await waitUntilSettled(actor);
            expect(actor.getSnapshot().matches('setNewPassword')).toBe(true);
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn)).toBe(true);
        });

        it('is absent on verifyRecoveryEmail', async () => {
            const actor = startActor();
            await navigateToVerifyRecoveryEmail(actor);
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn)).toBe(false);
        });

        it('is absent on recoveryFailed', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor);
            actor.send({ type: 'decision.no' });
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn)).toBe(false);
        });
    });

    describe('navigation sequences', () => {
        async function retry(actor: ReturnType<typeof startActor>, methods: RecoveryMethod[]) {
            await sendRecoveryStarted(actor, methods);
            return actor.getSnapshot();
        }

        it('skip email → back from the SMS step → the email code step again, sending a new code', async () => {
            const actor = startActor();
            await startRecoveryWith(actor, ['email', 'sms']);
            expect(actor.getSnapshot().matches('verifyRecoveryEmail')).toBe(true);
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: 'sendingCode' })).toBe(true);
            await waitUntilSettled(actor);
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: { awaitingCode: 'editing' } })).toBe(true);
            // The API keeps one reset token per account, which an SMS code sent meanwhile would have replaced
            expect(harnessOf(actor).sentCodes.map(({ method }) => method)).toEqual(['email', 'email']);

            // Skipping it again leads to the SMS step again
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
        });

        it('skip email → skip SMS → back from the phrase step goes back up the methods, offering each again', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email', 'sms', 'mnemonic']);
            actor.send({ type: 'decision.skip' });
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ enterRecoverySms: 'idle' })).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: 'sendingCode' })).toBe(true);
            await waitUntilSettled(actor);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('back up the methods → another way offers each again, in order', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email', 'sms', 'mnemonic']);
            actor.send({ type: 'decision.skip' });
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.back' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('verifyRecoveryEmail')).toBe(true);
            await waitUntilSettled(actor);

            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ enterRecoverySms: 'idle' })).toBe(true);
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('skip SMS only → back from the phrase step → the SMS step again', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['sms', 'mnemonic']);
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ enterRecoverySms: 'idle' })).toBe(true);
        });

        it('back from verifyRecoveryEmail → retry → email shown again', async () => {
            const actor = startActor();
            await startRecoveryWith(actor, ['email', 'sms']);
            expect(actor.getSnapshot().matches('verifyRecoveryEmail')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);

            const snap = await retry(actor, ['email', 'sms']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('verifyRecoverySms → back → enterRecoverySms (not entry)', async () => {
            const actor = startActor();
            await startRecoveryWith(actor, ['sms']);
            await requestSmsCode(actor);
            expect(actor.getSnapshot().matches('verifyRecoverySms')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
        });

        it('skip SMS from its code step → back from the phrase step → the SMS step, to send a code again', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['sms', 'mnemonic']);
            await requestSmsCode(actor);
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ enterRecoverySms: 'idle' })).toBe(true);
        });

        it('verified by email → back from the phrase step → entry: a valid code is a checkpoint', async () => {
            const actor = startActor();
            await verifyByEmail(actor, DeviceRecoveryLevel.NONE);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
            expect(actor.getSnapshot().context.resetResponse).toBeUndefined();
        });

        it('authenticated recovery → otherSessionsPrompt → back → enterPhrase (hasMnemonic)', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email', 'mnemonic']);
            await submitCode(
                actor,
                makeOwnershipProof({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse })
            );
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });

            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('authenticated recovery → otherSessionsPrompt → back → entry (no mnemonic)', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email']);
            await submitCode(
                actor,
                makeOwnershipProof({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse })
            );
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('skip email → verify by SMS → back from the sessions prompt → retry shows email first', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email', 'sms']);
            actor.send({ type: 'decision.skip' });
            await requestSmsCode(actor);
            await submitCode(actor, makeOwnershipProof({ resetResponse: makeResetResponse({ Sessions: sessions }) }));
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);

            const snap = await retry(actor, ['email', 'sms']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('skip email and SMS → back from the unauthenticated sessions prompt → the SMS step, then the email one', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['email', 'sms']);
            actor.send({ type: 'decision.skip' });
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { unauthenticatedRecovery: 'otherSessionsPrompt' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ enterRecoverySms: 'idle' })).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: 'sendingCode' })).toBe(true);
        });

        it('skip the phrase → back from the unauthenticated sessions prompt → the phrase step', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['sms', 'mnemonic']);
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ enterRecoverySms: 'idle' })).toBe(true);
        });

        it('skip email → SMS fails to send → back from the error → retry shows email first', async () => {
            // The API refuses the SMS code (a rate limit, say), not the email one
            const actor = startActor({
                sendResetCode: fromPromise(async ({ input }: { input: CodeInput }) => {
                    if (input.method === 'sms') {
                        throw methodNotAllowed();
                    }
                }),
            });
            await sendRecoveryStarted(actor, ['email', 'sms']);
            actor.send({ type: 'decision.skip' });
            await requestSmsCode(actor);
            expect(actor.getSnapshot().matches('recoveryMethodVerificationError')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
            expect(actor.getSnapshot().context.apiErrorMessage).toBeUndefined();

            const snap = await retry(actor, ['email', 'sms']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('verified → back to entry → a new attempt has to prove ownership again', async () => {
            const actor = startActor();
            await navigateToAuthenticatedRecoveryWithoutMnemonic(
                actor,
                makeResetResponse({ DelegatedAccesses: [socialContact()] })
            );
            await waitForState(actor, { authenticatedRecovery: 'socialRecoveryOffer' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
            expect(actor.getSnapshot().context).toMatchObject({
                ownershipVerificationMethod: undefined,
                ownershipVerificationCode: '',
                resetResponse: undefined,
                delegatedAccessContacts: [],
                deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
            });

            // Maybe for another account, one without email or SMS: nothing proves it's theirs
            await retry(actor, []);
            const snap = await waitForState(actor, { unauthenticatedRecovery: 'otherSessionsPrompt' });
            expect(snap.matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);

            // So back from "Couldn't recover your account" doesn't offer the earlier attempt's data-loss reset
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('the requests', () => {
        it('sends the email code when its step opens', async () => {
            const actor = startActor();
            await navigateToVerifyRecoveryEmail(actor);
            expect(harnessOf(actor).sentCodes).toEqual([
                { username: 'user@example.com', method: 'email', step: 'verifyRecoveryEmail' },
            ]);
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: { awaitingCode: 'editing' } })).toBe(true);
        });

        it('waits for the email code it sends as the step opens, without showing it as a request, before taking a code', async () => {
            // The code is never sent, so the step keeps waiting for it
            const actor = startActor({ sendResetCode: fromPromise(() => new Promise<void>(() => {})) });
            harnessOf(actor).methods = ['email'];
            actor.send({ type: 'username.submitted', payload: { username: 'user@example.com' } });
            const snapshot = await waitForState(actor, { verifyRecoveryEmail: 'sendingCode' });

            expect(snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.submitting)).toBe(false);
            // Verify waits for the code meanwhile, since checking one would race the send
            expect(snapshot.can({ type: 'code.submitted', payload: { code: '123456' } })).toBe(false);
            // So do back, still shown, and another way: the code could replace one sent meanwhile
            expect(snapshot.can({ type: 'decision.back' })).toBe(false);
            expect(selectCanGoBack(snapshot)).toBe(true);
            expect(snapshot.can({ type: 'decision.skip' })).toBe(false);
        });

        it('shows sending the SMS code, which the user asked for, as a request', async () => {
            const actor = startActor({ sendResetCode: fromPromise(() => new Promise<void>(() => {})) });
            await navigateToEnterRecoverySms(actor);
            actor.send({ type: 'code.requested' });
            const snapshot = actor.getSnapshot();

            expect(snapshot.matches({ enterRecoverySms: 'sendingCode' })).toBe(true);
            expect(snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.submitting)).toBe(true);
        });

        it('gives a method the API refuses its error step, with the reason', async () => {
            const actor = startActor({
                sendResetCode: fromPromise(() => Promise.reject(methodNotAllowed())),
            });
            await navigateToVerifyRecoveryEmail(actor);
            expect(actor.getSnapshot().matches('recoveryMethodVerificationError')).toBe(true);
            expect(actor.getSnapshot().context.apiErrorMessage).toBe(`error ${API_CUSTOM_ERROR_CODES.NOT_ALLOWED}`);
            expect(errors(actor)).toEqual([]);
        });

        it('shows an email code that failed to send, and still offers the code form', async () => {
            const error = new Error('network');
            const actor = startActor({ sendResetCode: fromPromise(() => Promise.reject(error)) });
            await navigateToVerifyRecoveryEmail(actor);
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: { awaitingCode: 'editing' } })).toBe(true);
            expect(errors(actor)).toEqual([error]);
        });

        it('only sends the SMS code once the user asks', async () => {
            const actor = startActor();
            await navigateToEnterRecoverySms(actor);
            expect(harnessOf(actor).sentCodes).toEqual([]);
            await requestSmsCode(actor);
            expect(harnessOf(actor).sentCodes).toEqual([
                { username: 'user@example.com', method: 'sms', step: 'enterRecoverySms' },
            ]);
        });

        it('shows an SMS code that failed to send, and lets the user ask again', async () => {
            const error = new Error('network');
            const actor = startActor({ sendResetCode: fromPromise(() => Promise.reject(error)) });
            await navigateToEnterRecoverySms(actor);
            await requestSmsCode(actor);
            expect(actor.getSnapshot().matches({ enterRecoverySms: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
        });

        it('shows a wrong code inline, and clears it once the user edits it', async () => {
            const actor = startActor({
                validateResetCode: fromPromise(() => Promise.reject(invalidCode())),
            });
            await navigateToVerifyRecoveryEmail(actor);
            await submitCode(actor);
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: { awaitingCode: 'editing' } })).toBe(true);
            expect(actor.getSnapshot().context.invalidCode).toBe(true);
            expect(errors(actor)).toEqual([]);

            actor.send({ type: 'code.edited' });
            expect(actor.getSnapshot().context.invalidCode).toBe(false);
        });

        it('shows a code check that failed for another reason, without calling the code wrong', async () => {
            const error = new Error('network');
            const actor = startActor({ validateResetCode: fromPromise(() => Promise.reject(error)) });
            await navigateToVerifyRecoveryEmail(actor);
            await submitCode(actor);
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: { awaitingCode: 'editing' } })).toBe(true);
            expect(actor.getSnapshot().context.invalidCode).toBe(false);
            expect(errors(actor)).toEqual([error]);
        });

        it('doesn’t show a wrong email code on the SMS code form', async () => {
            const actor = startActor({
                validateResetCode: fromPromise(() => Promise.reject(invalidCode())),
            });
            await sendRecoveryStarted(actor, ['email', 'sms']);
            await submitCode(actor);
            expect(actor.getSnapshot().context.invalidCode).toBe(true);

            actor.send({ type: 'decision.skip' });
            await requestSmsCode(actor);
            expect(actor.getSnapshot().matches({ verifyRecoverySms: { awaitingCode: 'editing' } })).toBe(true);
            expect(actor.getSnapshot().context.invalidCode).toBe(false);
        });

        it('doesn’t show a wrong SMS code again after going back and sending a new one', async () => {
            const actor = startActor({
                validateResetCode: fromPromise(() => Promise.reject(invalidCode())),
            });
            await navigateToVerifyRecoverySms(actor);
            await submitCode(actor);
            expect(actor.getSnapshot().context.invalidCode).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
            await requestSmsCode(actor);
            expect(actor.getSnapshot().matches({ verifyRecoverySms: { awaitingCode: 'editing' } })).toBe(true);
            expect(actor.getSnapshot().context.invalidCode).toBe(false);
        });

        it('doesn’t show a wrong SMS code on the email code form, while its new code is sent', async () => {
            const actor = startActor({
                validateResetCode: fromPromise(() => Promise.reject(invalidCode())),
            });
            await sendRecoveryStarted(actor, ['email', 'sms']);
            actor.send({ type: 'decision.skip' });
            await requestSmsCode(actor);
            await submitCode(actor);
            expect(actor.getSnapshot().context.invalidCode).toBe(true);

            actor.send({ type: 'decision.back' });
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ verifyRecoveryEmail: 'sendingCode' })).toBe(true);
            expect(actor.getSnapshot().context.invalidCode).toBe(false);
        });

        it('sends a new code from the dialog, then tells the code form', async () => {
            const actor = startActor({
                validateResetCode: fromPromise(() => Promise.reject(invalidCode())),
            });
            await navigateToVerifyRecoverySms(actor);
            await submitCode(actor);

            actor.send({ type: 'newCode.requested' });
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.newCodeDialog)).toBe(true);
            actor.send({ type: 'newCode.confirmed' });
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.resending)).toBe(true);
            await waitUntilSettled(actor);

            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.newCodeDialog)).toBe(false);
            expect(harnessOf(actor).sentCodes.at(-1)).toEqual({
                username: 'user@example.com',
                method: 'sms',
                step: 'verifyRecoverySms',
            });
            expect(harnessOf(actor).emitted).toContainEqual({ type: 'code.resent' });
            // The rejected code was the old one
            expect(actor.getSnapshot().context.invalidCode).toBe(false);
        });

        it('closes the new code dialog without sending one', async () => {
            const actor = startActor();
            await navigateToVerifyRecoverySms(actor);
            actor.send({ type: 'newCode.requested' });
            actor.send({ type: 'newCode.dismissed' });
            expect(actor.getSnapshot().matches({ verifyRecoverySms: { awaitingCode: 'editing' } })).toBe(true);
            expect(harnessOf(actor).sentCodes).toHaveLength(1);
        });

        describe('when the new code fails to send', () => {
            /** The first code is sent; the new one fails with this. */
            const failingResend = (error: unknown) => {
                let sent = 0;
                return fromPromise(async () => {
                    sent += 1;
                    if (sent > 1) {
                        throw error;
                    }
                });
            };

            async function resend(actor: ForgotPasswordActor) {
                actor.send({ type: 'newCode.requested' });
                actor.send({ type: 'newCode.confirmed' });
                await waitUntilSettled(actor);
            }

            it('keeps the dialog open, with the error, so the user can try again', async () => {
                const error = new Error('network');
                const actor = startActor({ sendResetCode: failingResend(error) });
                await navigateToVerifyRecoveryEmail(actor);
                await resend(actor);

                expect(actor.getSnapshot().matches({ verifyRecoveryEmail: { awaitingCode: 'newCodeDialog' } })).toBe(
                    true
                );
                expect(errors(actor)).toEqual([error]);
                expect(harnessOf(actor).emitted).not.toContainEqual({ type: 'code.resent' });
            });

            it('gives a new code the API refuses the error step, with the reason', async () => {
                const actor = startActor({
                    sendResetCode: failingResend(methodNotAllowed()),
                });
                await navigateToVerifyRecoveryEmail(actor);
                await resend(actor);

                expect(actor.getSnapshot().matches('recoveryMethodVerificationError')).toBe(true);
                expect(actor.getSnapshot().context.apiErrorMessage).toBe(`error ${API_CUSTOM_ERROR_CODES.NOT_ALLOWED}`);
                expect(errors(actor)).toEqual([]);
            });
        });

        it('shows a failed phrase check, and stays on the phrase', async () => {
            const error = new Error('wrong phrase');
            const actor = startActor({ validatePhrase: fromPromise(() => Promise.reject(error)) });
            await sendRecoveryStarted(actor, ['mnemonic']);
            await submitPhrase(actor);
            expect(actor.getSnapshot().matches({ mnemonicRecovery: { enterPhrase: 'idle' } })).toBe(true);
            expect(errors(actor)).toEqual([error]);
        });

        it('starts over, showing why, when the phrase signs in but decrypts no keys', async () => {
            // Signing in with the phrase deleted the code that proved ownership, so the attempt can't go on
            const error = new NoKeysDecryptedUsingPhraseError();
            const actor = startActor({ validatePhrase: fromPromise(() => Promise.reject(error)) });
            await verifyByEmail(actor, DeviceRecoveryLevel.NONE);
            await submitPhrase(actor);

            const snapshot = actor.getSnapshot();
            expect(snapshot.matches({ entry: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
            // The used-up code doesn't carry over; the username does, for the first step's form
            expect(snapshot.context.resetResponse).toBeUndefined();
            expect(snapshot.context.username).toBe('user@example.com');
        });

        describe('back and another way, while a request runs that they would race', () => {
            // Either can lead to a new code, which the request could then delete (a wrong code, the phrase signing in)
            // or replace (another code)
            it('wait for the phrase check, back still shown', async () => {
                const actor = startActor({
                    validatePhrase: fromPromise(() => new Promise<MnemonicDataWithoutAPI>(() => {})),
                });
                await sendRecoveryStarted(actor, ['email', 'mnemonic']);
                actor.send({ type: 'decision.skip' });
                actor.send({ type: 'phrase.submitted', payload: { mnemonic: 'recovery phrase' } });
                expect(selectCanGoBack(actor.getSnapshot())).toBe(true);

                actor.send({ type: 'decision.back' });
                actor.send({ type: 'decision.skip' });
                expect(actor.getSnapshot().matches({ mnemonicRecovery: { enterPhrase: 'validating' } })).toBe(true);
                expect(harnessOf(actor).sentCodes).toHaveLength(1);
            });

            it('wait for the SMS code being sent', async () => {
                const actor = startActor({
                    sendResetCode: fromPromise(({ input }: { input: CodeInput }) =>
                        input.method === 'sms' ? new Promise<void>(() => {}) : Promise.resolve()
                    ),
                });
                await sendRecoveryStarted(actor, ['email', 'sms']);
                actor.send({ type: 'decision.skip' });
                actor.send({ type: 'code.requested' });
                expect(selectCanGoBack(actor.getSnapshot())).toBe(true);

                actor.send({ type: 'decision.back' });
                actor.send({ type: 'decision.skip' });
                expect(actor.getSnapshot().matches({ enterRecoverySms: 'sendingCode' })).toBe(true);
            });

            it('wait for the code check', async () => {
                // Another way to the SMS step meanwhile, and its code, would be deleted by a check that fails late
                const actor = startActor({
                    validateResetCode: fromPromise(() => new Promise<OwnershipProof>(() => {})),
                });
                await sendRecoveryStarted(actor, ['email', 'sms']);
                actor.send({ type: 'code.submitted', payload: { code: '123456' } });
                expect(selectCanGoBack(actor.getSnapshot())).toBe(true);

                actor.send({ type: 'decision.back' });
                actor.send({ type: 'decision.skip' });
                expect(actor.getSnapshot().matches({ verifyRecoveryEmail: { awaitingCode: 'validating' } })).toBe(true);
            });

            it('wait for the email code being sent as its step opens', async () => {
                const actor = startActor({ sendResetCode: fromPromise(() => new Promise<void>(() => {})) });
                harnessOf(actor).methods = ['email', 'sms'];
                actor.send({ type: 'username.submitted', payload: { username: 'user@example.com' } });
                await waitForState(actor, { verifyRecoveryEmail: 'sendingCode' });
                expect(selectCanGoBack(actor.getSnapshot())).toBe(true);

                actor.send({ type: 'decision.back' });
                actor.send({ type: 'decision.skip' });
                expect(actor.getSnapshot().matches({ verifyRecoveryEmail: 'sendingCode' })).toBe(true);
            });

            it('work again once the request settled', async () => {
                const actor = startActor({
                    validatePhrase: fromPromise(() => Promise.reject(new Error('wrong phrase'))),
                });
                await sendRecoveryStarted(actor, ['email', 'mnemonic']);
                actor.send({ type: 'decision.skip' });
                await submitPhrase(actor);
                expect(actor.getSnapshot().can({ type: 'decision.back' })).toBe(true);

                actor.send({ type: 'decision.back' });
                expect(actor.getSnapshot().matches('verifyRecoveryEmail')).toBe(true);
            });
        });

        it('resets the password with what the flow recovered, and stays loading while the app signs in', async () => {
            const actor = startActor();
            await verifyByEmail(actor, DeviceRecoveryLevel.FULL);
            actor.send({ type: 'password.submitted', payload: { password: 'new password' } });
            await waitForState(actor, { setNewPassword: 'signedIn' });

            expect(harnessOf(actor).resets).toEqual([
                {
                    newPassword: 'new password',
                    username: 'user@example.com',
                    mnemonicData: undefined,
                    resetResponse: makeResetResponse(),
                    ownershipVerificationCode: 'token-abc',
                    ownershipVerificationMethod: 'email',
                    deviceRecoveryLevel: DeviceRecoveryLevel.FULL,
                },
            ]);
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.submitting)).toBe(true);
        });

        it('starts over, showing why, when the reset refuses the token', async () => {
            const error = resetTokenRejected();
            const actor = startActor({ resetPassword: fromPromise(() => Promise.reject(error)) });
            await verifyByEmail(actor, DeviceRecoveryLevel.FULL);
            actor.send({ type: 'password.submitted', payload: { password: 'new password' } });
            await waitUntilSettled(actor);

            const snapshot = actor.getSnapshot();
            expect(snapshot.matches({ entry: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
            // The refused token doesn't carry over; the username does, for the first step's form
            expect(snapshot.context.resetResponse).toBeUndefined();
            expect(snapshot.context.ownershipVerificationCode).toBe('');
            expect(snapshot.context.username).toBe('user@example.com');
        });

        it('starts over, showing why, when the reset refuses the new keys after taking the token', async () => {
            const error = resetKeysRejected();
            const actor = startActor({ resetPassword: fromPromise(() => Promise.reject(error)) });
            await navigateToDataLossOffer(actor);
            actor.send({ type: 'decision.yes' });
            actor.send({ type: 'password.submitted', payload: { password: 'new password' } });
            await waitUntilSettled(actor);

            const snapshot = actor.getSnapshot();
            expect(snapshot.matches({ entry: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
            // Neither the ownership the failed attempt proved nor the data loss it accepted carries over
            expect(snapshot.context.resetResponse).toBeUndefined();
            expect(snapshot.context.resetWithDataLoss).toBe(false);
        });

        it('only starts over on a `ResetTokenRejectedError`, not on its API code', async () => {
            // Only the reset request refuses the token, as a `ResetTokenRejectedError`: anything else failing with the
            // same code shows like any error, and the form can be sent again
            const error = apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE);
            const actor = startActor({ resetPassword: fromPromise(() => Promise.reject(error)) });
            await verifyByEmail(actor, DeviceRecoveryLevel.FULL);
            actor.send({ type: 'password.submitted', payload: { password: 'new password' } });
            await waitUntilSettled(actor);

            expect(actor.getSnapshot().matches({ setNewPassword: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
        });

        it('sends the user to sign in once the password is changed, if signing in with it fails', async () => {
            const cause = new Error('network');
            const actor = startActor({
                resetPassword: fromPromise(() => Promise.reject(new SignInAfterResetError(cause))),
            });
            await verifyByEmail(actor, DeviceRecoveryLevel.FULL);
            actor.send({ type: 'password.submitted', payload: { password: 'new password' } });
            await waitForState(actor, { setNewPassword: 'passwordChanged' });

            // The page traces what failed, without showing it
            expect(harnessOf(actor).emitted).toContainEqual({ type: 'signIn.failed', error: cause });
            expect(errors(actor)).toEqual([]);
            // The sign-in form starts with the username, and this one stays loading while the page leaves
            expect(harnessOf(actor).signInRedirects).toEqual(['user@example.com']);
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.submitting)).toBe(true);
        });

        it('shows a reset that failed for another reason, and the form can be sent again', async () => {
            const error = new Error('network');
            const actor = startActor({ resetPassword: fromPromise(() => Promise.reject(error)) });
            await verifyByEmail(actor, DeviceRecoveryLevel.FULL);
            actor.send({ type: 'password.submitted', payload: { password: 'new password' } });
            await waitUntilSettled(actor);

            expect(actor.getSnapshot().matches({ setNewPassword: 'idle' })).toBe(true);
            expect(errors(actor)).toEqual([error]);
        });

        it('resets the password with the recovery phrase’s keys after the phrase step', async () => {
            const actor = startActor();
            await sendRecoveryStarted(actor, ['mnemonic']);
            await submitPhrase(actor);
            actor.send({ type: 'decision.confirm' });
            actor.send({ type: 'password.submitted', payload: { password: 'new password' } });
            await waitForState(actor, { setNewPassword: 'signedIn' });

            expect(harnessOf(actor).resets).toEqual([
                expect.objectContaining({ newPassword: 'new password', mnemonicData, resetResponse: undefined }),
            ]);
        });
    });
});
