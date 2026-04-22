import { createActor, fromPromise, waitFor } from 'xstate';
import type { AnyActorLogic, StateValue } from 'xstate';

import type { MnemonicData } from '@proton/components/containers/resetPassword/interface';
import type {
    DelegatedAccessSummary,
    ExistingSession,
    RecoveryMethod,
    ValidateResetTokenResponse,
} from '@proton/shared/lib/api/reset';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { DeviceRecoveryLevel } from '../actions';
import {
    UnauthedForgotPasswordStateMachine,
    UnauthedForgotPasswordStateMachineTags,
} from './UnauthedForgotPasswordStateMachine';

function makeResetResponse(
    overrides: { Sessions?: ExistingSession[]; DelegatedAccesses?: DelegatedAccessSummary[] } = {}
): ValidateResetTokenResponse {
    return {
        Sessions: [],
        DelegatedAccesses: [],
        ...overrides,
    } as unknown as ValidateResetTokenResponse;
}

function makeOwnershipPayload(
    overrides: {
        deviceRecoveryLevel?: DeviceRecoveryLevel;
        resetResponse?: ValidateResetTokenResponse;
        ownershipVerificationCode?: string;
    } = {}
) {
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

const rejecting = fromPromise<void>(() => Promise.reject(new Error('actor-error')));

type ActorKey =
    | 'fetchRecoveryMethods'
    | 'checkDeviceRecovery'
    | 'checkMnemonic'
    | 'checkOtherSessions'
    | 'checkSocialRecovery';
type ActorOverrides = Partial<Record<ActorKey, AnyActorLogic>>;

function startActor(overrides: ActorOverrides = {}) {
    const machine = UnauthedForgotPasswordStateMachine.provide({
        actors: {
            fetchRecoveryMethods: fromPromise(() => Promise.resolve([])),
            checkDeviceRecovery: fromPromise<void>(() => Promise.resolve()),
            checkMnemonic: fromPromise<void>(() => Promise.resolve()),
            checkOtherSessions: fromPromise<void>(() => Promise.resolve()),
            checkSocialRecovery: fromPromise<void>(() => Promise.resolve()),
            ...overrides,
        } as NonNullable<Parameters<typeof UnauthedForgotPasswordStateMachine.provide>[0]['actors']>,
    });
    const actor = createActor(machine);
    actor.start();
    return actor;
}

function waitUntilLeft(actor: ReturnType<typeof startActor>, state: StateValue) {
    return waitFor(actor, (snap) => !snap.matches(state as any), { timeout: 1_000 });
}

function waitForState(actor: ReturnType<typeof startActor>, state: StateValue) {
    return waitFor(actor, (snap) => snap.matches(state as any), { timeout: 1_000 });
}

function sendRecoveryStarted(
    actor: ReturnType<typeof startActor>,
    methods: RecoveryMethod[] = [],
    extras: { redactedEmail?: string; redactedPhoneNumber?: string } = {}
) {
    actor.send({
        type: 'recovery.started',
        payload: {
            methods,
            username: 'user@example.com',
            accountType: 'internal',
            redactedEmail: extras.redactedEmail,
            redactedPhoneNumber: extras.redactedPhoneNumber,
        },
    });
}

async function navigatePastLoadRecoveryMethods(actor: ReturnType<typeof startActor>, methods: RecoveryMethod[] = []) {
    sendRecoveryStarted(actor, methods);
    return waitUntilLeft(actor, 'loadRecoveryMethods');
}

async function navigateToVerifyRecoveryEmail(actor: ReturnType<typeof startActor>) {
    await navigatePastLoadRecoveryMethods(actor, ['email']);
}

async function navigateToEnterRecoverySms(actor: ReturnType<typeof startActor>) {
    await navigatePastLoadRecoveryMethods(actor, ['sms']);
}

async function navigateToVerifyRecoverySms(actor: ReturnType<typeof startActor>) {
    await navigateToEnterRecoverySms(actor);
    actor.send({ type: 'sms.code.sent' });
}

async function navigatePastCheckDeviceRecovery(
    actor: ReturnType<typeof startActor>,
    deviceRecoveryLevel: DeviceRecoveryLevel,
    resetResponse = makeResetResponse()
) {
    await navigateToVerifyRecoveryEmail(actor);
    actor.send({
        type: 'email.code.validated',
        payload: makeOwnershipPayload({ deviceRecoveryLevel, resetResponse }),
    });
    return waitUntilLeft(actor, 'checkDeviceRecovery');
}

async function navigateToAuthenticatedRecovery(
    actor: ReturnType<typeof startActor>,
    resetResponse = makeResetResponse()
) {
    sendRecoveryStarted(actor, ['email', 'mnemonic']);
    await waitUntilLeft(actor, 'loadRecoveryMethods');
    actor.send({
        type: 'email.code.validated',
        payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse }),
    });
    await waitUntilLeft(actor, 'checkDeviceRecovery');
    await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
    actor.send({ type: 'decision.skip' });
    return waitForState(actor, { authenticatedRecovery: 'checkOtherSessions' });
}

async function navigatePastAuthenticatedInvokeChain(
    actor: ReturnType<typeof startActor>,
    resetResponse = makeResetResponse()
) {
    await navigateToAuthenticatedRecovery(actor, resetResponse);
    await waitUntilLeft(actor, { authenticatedRecovery: 'checkOtherSessions' });
    return waitUntilLeft(actor, { authenticatedRecovery: 'checkSocialRecovery' });
}

async function navigateToUnauthenticatedRecovery(actor: ReturnType<typeof startActor>) {
    await navigatePastLoadRecoveryMethods(actor, []);
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
        it('recovery.started → loadRecoveryMethods and assigns context', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['email'], { redactedEmail: 'u***@example.com' });
            const snap = actor.getSnapshot();
            expect(snap.matches('loadRecoveryMethods')).toBe(true);
            expect(snap.context.recoveryMethods).toEqual(['email']);
            expect(snap.context.username).toBe('user@example.com');
            expect(snap.context.redactedRecoveryEmail).toBe('u***@example.com');
        });

        it('help.opened → doneHelpExit (final state)', () => {
            const actor = startActor();
            actor.send({ type: 'help.opened' });
            expect(actor.getSnapshot().matches('doneHelpExit')).toBe(true);
        });

        it('mnemonic.prefilled → setNewPassword and assigns username + mnemonicData', () => {
            const actor = startActor();
            const mnemonicData = { authResponse: {} as AuthResponse, decryptedUserKeys: [] };
            actor.send({
                type: 'mnemonic.prefilled',
                payload: { username: 'prefilled@example.com', mnemonicData },
            });
            const snap = actor.getSnapshot();
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

        it('token.prefilled → setNewPassword and assigns token context', () => {
            const actor = startActor();
            const resetResponse = makeResetResponse({ DelegatedAccesses: [socialContact()] });
            actor.send({
                type: 'token.prefilled',
                payload: {
                    username: 'token@example.com',
                    ownershipVerificationCode: 'tok-xyz',
                    resetResponse,
                    deviceRecoveryLevel: DeviceRecoveryLevel.FULL,
                },
            });
            const snap = actor.getSnapshot();
            expect(snap.matches('setNewPassword')).toBe(true);
            expect(snap.context.username).toBe('token@example.com');
            expect(snap.context.ownershipVerificationCode).toBe('tok-xyz');
            expect(snap.context.ownershipVerificationMethod).toBe('mnemonic');
            expect(snap.context.deviceRecoveryLevel).toBe(DeviceRecoveryLevel.FULL);
            expect(snap.context.delegatedAccessContacts).toHaveLength(1);
        });
    });

    describe('loadRecoveryMethods routing', () => {
        it('email available → verifyRecoveryEmail', async () => {
            const actor = startActor();
            const snap = await navigatePastLoadRecoveryMethods(actor, ['email']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('sms available (no email) → enterRecoverySms', async () => {
            const actor = startActor();
            const snap = await navigatePastLoadRecoveryMethods(actor, ['sms']);
            expect(snap.matches('enterRecoverySms')).toBe(true);
        });

        it('email skipped, sms available → enterRecoverySms', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['email', 'sms']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({ type: 'decision.skip' });
            const snap = await waitUntilLeft(actor, 'loadRecoveryMethods');
            expect(snap.matches('enterRecoverySms')).toBe(true);
        });

        it('no email/sms → mnemonicRecovery.checkMnemonic', async () => {
            const actor = startActor();
            const snap = await navigatePastLoadRecoveryMethods(actor, ['mnemonic']);
            expect(snap.matches({ mnemonicRecovery: 'checkMnemonic' })).toBe(true);
        });

        it('actor error → fatalError with ERROR_FETCHING_RECOVERY_METHODS', async () => {
            const actor = startActor({ fetchRecoveryMethods: rejecting });
            sendRecoveryStarted(actor, ['email']);
            const snap = await waitUntilLeft(actor, 'loadRecoveryMethods');
            expect(snap.matches('fatalError')).toBe(true);
            expect(snap.context.errorCode).toBe('ERROR_FETCHING_RECOVERY_METHODS');
        });
    });

    describe('verifyRecoveryEmail', () => {
        it('email.code.validated → checkDeviceRecovery and assigns ownership context', async () => {
            const actor = startActor();
            await navigateToVerifyRecoveryEmail(actor);
            const resetResponse = makeResetResponse({ DelegatedAccesses: [emergencyContact()] });
            actor.send({
                type: 'email.code.validated',
                payload: makeOwnershipPayload({ resetResponse, deviceRecoveryLevel: DeviceRecoveryLevel.PARTIAL }),
            });
            const snap = actor.getSnapshot();
            expect(snap.matches('checkDeviceRecovery')).toBe(true);
            expect(snap.context.ownershipVerificationMethod).toBe('email');
            expect(snap.context.ownershipVerificationCode).toBe('token-abc');
            expect(snap.context.deviceRecoveryLevel).toBe(DeviceRecoveryLevel.PARTIAL);
            expect(snap.context.delegatedAccessContacts).toHaveLength(1);
        });

        it('decision.back → entry and resets skip flags', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['email', 'sms']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({ type: 'decision.skip' });
            const snapSms = await waitUntilLeft(actor, 'loadRecoveryMethods');
            expect(snapSms.matches('enterRecoverySms')).toBe(true);
            const actor2 = startActor();
            await navigateToVerifyRecoveryEmail(actor2);
            actor2.send({ type: 'decision.back' });
            const snap = actor2.getSnapshot();
            expect(snap.matches('entry')).toBe(true);
            expect(snap.context.emailRecoverySkipped).toBe(false);
            expect(snap.context.smsRecoverySkipped).toBe(false);
        });

        it('decision.skip → loadRecoveryMethods with emailRecoverySkipped = true', async () => {
            const actor = startActor();
            await navigateToVerifyRecoveryEmail(actor);
            actor.send({ type: 'decision.skip' });
            const snap = actor.getSnapshot();
            expect(snap.matches('loadRecoveryMethods')).toBe(true);
            expect(snap.context.emailRecoverySkipped).toBe(true);
        });
    });

    describe('enterRecoverySms', () => {
        it('sms.code.sent → verifyRecoverySms', async () => {
            const actor = startActor();
            await navigateToEnterRecoverySms(actor);
            actor.send({ type: 'sms.code.sent' });
            expect(actor.getSnapshot().matches('verifyRecoverySms')).toBe(true);
        });

        it('decision.back → entry and resets skip flags', async () => {
            const actor = startActor();
            await navigateToEnterRecoverySms(actor);
            actor.send({ type: 'decision.back' });
            const snap = actor.getSnapshot();
            expect(snap.matches('entry')).toBe(true);
            expect(snap.context.smsRecoverySkipped).toBe(false);
            expect(snap.context.emailRecoverySkipped).toBe(false);
        });

        it('decision.skip → loadRecoveryMethods with smsRecoverySkipped = true', async () => {
            const actor = startActor();
            await navigateToEnterRecoverySms(actor);
            actor.send({ type: 'decision.skip' });
            const snap = actor.getSnapshot();
            expect(snap.matches('loadRecoveryMethods')).toBe(true);
            expect(snap.context.smsRecoverySkipped).toBe(true);
        });
    });

    describe('verifyRecoverySms', () => {
        it('sms.code.validated → checkDeviceRecovery and assigns ownership context', async () => {
            const actor = startActor();
            await navigateToVerifyRecoverySms(actor);
            actor.send({
                type: 'sms.code.validated',
                payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.FULL }),
            });
            const snap = actor.getSnapshot();
            expect(snap.matches('checkDeviceRecovery')).toBe(true);
            expect(snap.context.ownershipVerificationMethod).toBe('sms');
            expect(snap.context.deviceRecoveryLevel).toBe(DeviceRecoveryLevel.FULL);
        });

        it('decision.back → enterRecoverySms', async () => {
            const actor = startActor();
            await navigateToVerifyRecoverySms(actor);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
        });

        it('decision.skip → loadRecoveryMethods with smsRecoverySkipped = true', async () => {
            const actor = startActor();
            await navigateToVerifyRecoverySms(actor);
            actor.send({ type: 'decision.skip' });
            const snap = actor.getSnapshot();
            expect(snap.matches('loadRecoveryMethods')).toBe(true);
            expect(snap.context.smsRecoverySkipped).toBe(true);
        });
    });

    describe('checkDeviceRecovery', () => {
        it('FULL device recovery → setNewPassword', async () => {
            const actor = startActor();
            const snap = await navigatePastCheckDeviceRecovery(actor, DeviceRecoveryLevel.FULL);
            expect(snap.matches('setNewPassword')).toBe(true);
        });

        it('PARTIAL device recovery → mnemonicRecovery.checkMnemonic', async () => {
            const actor = startActor();
            const snap = await navigatePastCheckDeviceRecovery(actor, DeviceRecoveryLevel.PARTIAL);
            expect(snap.matches({ mnemonicRecovery: 'checkMnemonic' })).toBe(true);
        });

        it('NONE device recovery → mnemonicRecovery.checkMnemonic', async () => {
            const actor = startActor();
            const snap = await navigatePastCheckDeviceRecovery(actor, DeviceRecoveryLevel.NONE);
            expect(snap.matches({ mnemonicRecovery: 'checkMnemonic' })).toBe(true);
        });

        it('actor error → mnemonicRecovery.checkMnemonic', async () => {
            const actor = startActor({ checkDeviceRecovery: rejecting });
            await navigateToVerifyRecoveryEmail(actor);
            actor.send({
                type: 'email.code.validated',
                payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.FULL }),
            });
            const snap = await waitUntilLeft(actor, 'checkDeviceRecovery');
            expect(snap.matches({ mnemonicRecovery: 'checkMnemonic' })).toBe(true);
        });
    });

    describe('mnemonicRecovery.checkMnemonic', () => {
        it('mnemonic available → enterPhrase', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['mnemonic']);
            const snap = await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            expect(snap.matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
        });

        it('no mnemonic + has resetResponse → authenticatedRecovery', async () => {
            const actor = startActor();
            const resetResponse = makeResetResponse();
            sendRecoveryStarted(actor, ['email']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({
                type: 'email.code.validated',
                payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse }),
            });
            await waitUntilLeft(actor, 'checkDeviceRecovery');
            const snap = await waitForState(actor, { authenticatedRecovery: 'checkOtherSessions' });
            expect(snap.matches({ authenticatedRecovery: 'checkOtherSessions' })).toBe(true);
        });

        it('no mnemonic + no resetResponse → unauthenticatedRecovery', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, []);
            const snap = await waitForState(actor, { unauthenticatedRecovery: 'otherSessionsPrompt' });
            expect(snap.matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('actor error → fatalError with ERROR_FETCHING_MNEMONIC', async () => {
            const actor = startActor({ checkMnemonic: rejecting });
            sendRecoveryStarted(actor, []);
            const snap = await waitForState(actor, 'fatalError');
            expect(snap.matches('fatalError')).toBe(true);
            expect(snap.context.errorCode).toBe('ERROR_FETCHING_MNEMONIC');
        });
    });

    describe('mnemonicRecovery.enterPhrase', () => {
        it('mnemonic.validated → confirmPhrase and stores mnemonicData', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            const mnemonicData = { authResponse: {} as AuthResponse, decryptedUserKeys: [] };
            actor.send({ type: 'mnemonic.validated', payload: { mnemonicData } });
            const snap = actor.getSnapshot();
            expect(snap.matches({ mnemonicRecovery: 'confirmPhrase' })).toBe(true);
            expect(snap.context.mnemonicData).toBe(mnemonicData);
        });

        it('decision.back → entry and resets skip flags', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.back' });
            const snap = actor.getSnapshot();
            expect(snap.matches('entry')).toBe(true);
            expect(snap.context.emailRecoverySkipped).toBe(false);
            expect(snap.context.smsRecoverySkipped).toBe(false);
        });

        it('decision.skip with resetResponse → authenticatedRecovery.checkOtherSessions', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['email', 'mnemonic']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({
                type: 'email.code.validated',
                payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE }),
            });
            await waitUntilLeft(actor, 'checkDeviceRecovery');
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.skip' });
            const snap = await waitForState(actor, { authenticatedRecovery: 'checkOtherSessions' });
            expect(snap.matches({ authenticatedRecovery: 'checkOtherSessions' })).toBe(true);
        });

        it('decision.skip without resetResponse → unauthenticatedRecovery', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'decision.skip' });
            const snap = actor.getSnapshot();
            expect(snap.matches({ unauthenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('mnemonicRecovery.confirmPhrase', () => {
        it('decision.confirm → setNewPassword', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['mnemonic']);
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            actor.send({ type: 'mnemonic.validated', payload: { mnemonicData: {} as Omit<MnemonicData, 'api'> } });
            actor.send({ type: 'decision.confirm' });
            expect(actor.getSnapshot().matches('setNewPassword')).toBe(true);
        });
    });

    describe('authenticatedRecovery.checkOtherSessions', () => {
        it('sessions present → otherSessionsPrompt', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            await navigateToAuthenticatedRecovery(actor, resetResponse);
            const snap = await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });
            expect(snap.matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });

        it('no sessions → skips otherSessionsPrompt and routes via checkSocialRecovery', async () => {
            const actor = startActor();
            await navigatePastAuthenticatedInvokeChain(actor, makeResetResponse());
            expect(actor.getSnapshot().matches('offerDataLossReset')).toBe(true);
        });

        it('actor error → routes to checkSocialRecovery then offerDataLossReset', async () => {
            const actor = startActor({ checkOtherSessions: rejecting });
            await navigatePastAuthenticatedInvokeChain(actor, makeResetResponse());
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

        it('decision.no → checkSocialRecovery', async () => {
            const actor = await navigateToOtherSessionsPrompt();
            actor.send({ type: 'decision.no' });
            const snap = await waitForState(actor, { authenticatedRecovery: 'checkSocialRecovery' });
            expect(snap.matches({ authenticatedRecovery: 'checkSocialRecovery' })).toBe(true);
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
            sendRecoveryStarted(actor, ['email']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({
                type: 'email.code.validated',
                payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse }),
            });
            await waitUntilLeft(actor, 'checkDeviceRecovery');
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

        it('decision.skip → checkSocialRecovery', async () => {
            const actor = await navigateToActiveSessionInstructions();
            actor.send({ type: 'decision.skip' });
            const snap = await waitForState(actor, { authenticatedRecovery: 'checkSocialRecovery' });
            expect(snap.matches({ authenticatedRecovery: 'checkSocialRecovery' })).toBe(true);
        });

        it('decision.back → otherSessionsPrompt', async () => {
            const actor = await navigateToActiveSessionInstructions();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ authenticatedRecovery: 'otherSessionsPrompt' })).toBe(true);
        });
    });

    describe('authenticatedRecovery.checkSocialRecovery', () => {
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
            const snap = await navigatePastAuthenticatedInvokeChain(actor, makeResetResponse());
            expect(snap.matches('offerDataLossReset')).toBe(true);
        });

        it('actor error → offerDataLossReset', async () => {
            const actor = startActor({ checkSocialRecovery: rejecting });
            await navigateToAuthenticatedRecovery(actor, makeResetResponse());
            const snap = await waitForState(actor, 'offerDataLossReset');
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

        it('decision.back → mnemonicRecovery.enterPhrase', async () => {
            const actor = await navigateToSocialRecoveryOffer();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
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

        it('decision.back → mnemonicRecovery.enterPhrase', async () => {
            const actor = await navigateToAuthenticatedEmergencyOffer();
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ mnemonicRecovery: 'enterPhrase' })).toBe(true);
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

        it('decision.no → emergencyAccessOffer', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor);
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });

        it('decision.back → entry', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });
    });

    describe('unauthenticatedRecovery.activeSessionInstructions', () => {
        async function navigateToUnauthActiveSession() {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor);
            actor.send({ type: 'decision.yes' });
            return actor;
        }

        it('decision.skip → emergencyAccessOffer', async () => {
            const actor = await navigateToUnauthActiveSession();
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
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
            await navigateToUnauthenticatedRecovery(actor);
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
                await navigateToUnauthenticatedRecovery(actor);
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
            await navigatePastAuthenticatedInvokeChain(actor, makeResetResponse());
            actor.send({ type: 'decision.yes' });
            const snap = actor.getSnapshot();
            expect(snap.matches('setNewPassword')).toBe(true);
            expect(snap.context.resetWithDataLoss).toBe(true);
        });

        it('decision.skip → recoveryFailed', async () => {
            const actor = startActor();
            await navigatePastAuthenticatedInvokeChain(actor, makeResetResponse());
            actor.send({ type: 'decision.skip' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
        });
    });

    describe('recoveryFailed', () => {
        it('decision.back → unauthenticatedRecovery.emergencyAccessOffer', async () => {
            const actor = startActor();
            await navigateToUnauthenticatedRecovery(actor);
            actor.send({ type: 'decision.no' });
            actor.send({ type: 'decision.no' });
            expect(actor.getSnapshot().matches('recoveryFailed')).toBe(true);
            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches({ unauthenticatedRecovery: 'emergencyAccessOffer' })).toBe(true);
        });
    });

    describe('hideReturnToSignIn tag', () => {
        it('is present on entry', () => {
            const actor = startActor();
            expect(actor.getSnapshot().hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn)).toBe(true);
        });

        it('is present on setNewPassword', () => {
            const actor = startActor();
            actor.send({
                type: 'mnemonic.prefilled',
                payload: { username: 'u@example.com', mnemonicData: {} as Omit<MnemonicData, 'api'> },
            });
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
            sendRecoveryStarted(actor, methods);
            return waitUntilLeft(actor, 'loadRecoveryMethods');
        }

        it('skip email → back from SMS enter → retry shows email first', async () => {
            const actor = startActor();
            await navigatePastLoadRecoveryMethods(actor, ['email', 'sms']);
            expect(actor.getSnapshot().matches('verifyRecoveryEmail')).toBe(true);
            actor.send({ type: 'decision.skip' });
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
            expect(actor.getSnapshot().context.emailRecoverySkipped).toBe(false);
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(false);

            const snap = await retry(actor, ['email', 'sms']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('skip email → skip SMS → back from mnemonic enterPhrase → retry shows email first', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['email', 'sms', 'mnemonic']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({ type: 'decision.skip' });
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            expect(actor.getSnapshot().context.emailRecoverySkipped).toBe(true);
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
            expect(actor.getSnapshot().context.emailRecoverySkipped).toBe(false);
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(false);

            const snap = await retry(actor, ['email', 'sms', 'mnemonic']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('skip SMS only → back from mnemonic enterPhrase → retry shows SMS first', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['sms', 'mnemonic']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(false);

            const snap = await retry(actor, ['sms', 'mnemonic']);
            expect(snap.matches('enterRecoverySms')).toBe(true);
        });

        it('back from verifyRecoveryEmail → retry → email shown again (flag was never set)', async () => {
            const actor = startActor();
            await navigatePastLoadRecoveryMethods(actor, ['email', 'sms']);
            expect(actor.getSnapshot().matches('verifyRecoveryEmail')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);

            const snap = await retry(actor, ['email', 'sms']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
        });

        it('verifyRecoverySms → back → enterRecoverySms (not entry)', async () => {
            const actor = startActor();
            await navigatePastLoadRecoveryMethods(actor, ['sms']);
            actor.send({ type: 'sms.code.sent' });
            expect(actor.getSnapshot().matches('verifyRecoverySms')).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(false);
        });

        it('skip SMS from verifyRecoverySms sets flag → back from enterPhrase resets it', async () => {
            const actor = startActor();
            sendRecoveryStarted(actor, ['sms', 'mnemonic']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({ type: 'sms.code.sent' });
            actor.send({ type: 'decision.skip' });
            await waitForState(actor, { mnemonicRecovery: 'enterPhrase' });
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(true);

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().context.smsRecoverySkipped).toBe(false);

            const snap = await retry(actor, ['sms', 'mnemonic']);
            expect(snap.matches('enterRecoverySms')).toBe(true);
        });

        it('authenticated recovery → otherSessionsPrompt → back → enterPhrase (hasMnemonic)', async () => {
            const sessions: ExistingSession[] = [{ CreateTime: 0, LocalizedClientName: 'session-1' }];
            const resetResponse = makeResetResponse({ Sessions: sessions });
            const actor = startActor();
            sendRecoveryStarted(actor, ['email', 'mnemonic']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({
                type: 'email.code.validated',
                payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse }),
            });
            await waitUntilLeft(actor, 'checkDeviceRecovery');
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
            sendRecoveryStarted(actor, ['email']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({
                type: 'email.code.validated',
                payload: makeOwnershipPayload({ deviceRecoveryLevel: DeviceRecoveryLevel.NONE, resetResponse }),
            });
            await waitUntilLeft(actor, 'checkDeviceRecovery');
            await waitForState(actor, { authenticatedRecovery: 'otherSessionsPrompt' });

            actor.send({ type: 'decision.back' });
            expect(actor.getSnapshot().matches('entry')).toBe(true);
        });

        it('skip email in attempt 1 → back → attempt 2 sees email fresh', async () => {
            const actor = startActor();

            sendRecoveryStarted(actor, ['email', 'sms']);
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            actor.send({ type: 'decision.skip' });
            await waitUntilLeft(actor, 'loadRecoveryMethods');
            expect(actor.getSnapshot().matches('enterRecoverySms')).toBe(true);
            actor.send({ type: 'decision.back' });

            const snap = await retry(actor, ['email', 'sms']);
            expect(snap.matches('verifyRecoveryEmail')).toBe(true);
            expect(snap.context.emailRecoverySkipped).toBe(false);
        });
    });
});
