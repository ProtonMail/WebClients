import type { ComponentType } from 'react';

import type { StateValueFrom } from 'xstate';

import type {
    UnauthedForgotPasswordSnapshot,
    UnauthedForgotPasswordStateMachine,
} from './state-machine/UnauthedForgotPasswordStateMachine';
import { AccountLost } from './steps/authenticated-recovery/AccountLost';
import { AuthenticatedSessionPrompt } from './steps/authenticated-recovery/AuthenticatedSessionPrompt';
import { EmergencyAccessStep } from './steps/authenticated-recovery/delegated-access/EmergencyAccessStep';
import { SocialRecoveryStep } from './steps/authenticated-recovery/delegated-access/SocialRecoveryStep';
import { VerifyEmailRecoveryCode } from './steps/email-recovery/VerifyEmailRecoveryCode';
import { EntryStep } from './steps/entry/EntryStep';
import { RecoveryMethodVerificationError } from './steps/error/RecoveryMethodVerificationError';
import { ConfirmMnemonicPhraseRecovery } from './steps/mnemonic-recovery/ConfirmMnemonicPhraseRecovery';
import { EnterMnemonicPhrase } from './steps/mnemonic-recovery/EnterMnemonicPhrase';
import { ResetPassword } from './steps/reset-password/ResetPassword';
import { ResetPasswordWithDataLoss } from './steps/reset-password/ResetPasswordWithDataLoss';
import { ConfirmPhoneVerification } from './steps/sms-recovery/ConfirmPhoneVerification';
import { VerifySMSRecoveryCode } from './steps/sms-recovery/VerifySMSRecoveryCode';
import { OtherLoggedInSessionPrompt } from './steps/unauthenticated-recovery/OtherLoggedInSessionPrompt';
import { ShowEmergencyContactsInstructions } from './steps/unauthenticated-recovery/ShowEmergencyContactsInstructions';
import { ShowSignedInResetSteps } from './steps/unauthenticated-recovery/ShowSignedInResetSteps';
import type { ForgotPasswordStepProps } from './wizard/forgotPasswordStep';

type ForgotPasswordState = StateValueFrom<typeof UnauthedForgotPasswordStateMachine>;

/**
 * The step each state shows, found with `snapshot.matches`. The states are typed against the machine, so renaming one
 * without updating this list fails to compile. The `route*` states pass straight through, so they have no step.
 */
const forgotPasswordSteps: [ForgotPasswordState, ComponentType<ForgotPasswordStepProps>][] = [
    ['entry', EntryStep],
    ['verifyRecoveryEmail', VerifyEmailRecoveryCode],
    ['enterRecoverySms', ConfirmPhoneVerification],
    ['verifyRecoverySms', VerifySMSRecoveryCode],
    [{ mnemonicRecovery: 'enterPhrase' }, EnterMnemonicPhrase],
    [{ mnemonicRecovery: 'confirmPhrase' }, ConfirmMnemonicPhraseRecovery],
    [{ unauthenticatedRecovery: 'otherSessionsPrompt' }, OtherLoggedInSessionPrompt],
    [{ unauthenticatedRecovery: 'activeSessionInstructions' }, ShowSignedInResetSteps],
    [{ unauthenticatedRecovery: 'emergencyAccessOffer' }, EmergencyAccessStep],
    [{ unauthenticatedRecovery: 'emergencyContactInstructions' }, ShowEmergencyContactsInstructions],
    [{ authenticatedRecovery: 'otherSessionsPrompt' }, AuthenticatedSessionPrompt],
    [{ authenticatedRecovery: 'activeSessionInstructions' }, ShowSignedInResetSteps],
    [{ authenticatedRecovery: 'socialRecoveryOffer' }, SocialRecoveryStep],
    [{ authenticatedRecovery: 'emergencyAccessOffer' }, EmergencyAccessStep],
    ['offerDataLossReset', ResetPasswordWithDataLoss],
    ['recoveryFailed', AccountLost],
    ['setNewPassword', ResetPassword],
    ['recoveryMethodVerificationError', RecoveryMethodVerificationError],
];

/** The step for the state the flow is in, for the wizard to show. */
export const selectStep = (snapshot: UnauthedForgotPasswordSnapshot) =>
    forgotPasswordSteps.find(([state]) => snapshot.matches(state))?.[1];
