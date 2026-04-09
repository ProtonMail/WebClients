import type { ComponentType } from 'react';

import type { ForgotPasswordStatePath } from './state-machine/statePath';
import { AccountLost } from './steps/authenticated-recovery/AccountLost';
import { AuthenticatedSessionPrompt } from './steps/authenticated-recovery/AuthenticatedSessionPrompt';
import { EmergencyAccessStep } from './steps/authenticated-recovery/delegated-access/EmergencyAccessStep';
import { SocialRecoveryStep } from './steps/authenticated-recovery/delegated-access/SocialRecoveryStep';
import { VerifyEmailRecoveryCode } from './steps/email-recovery/VerifyEmailRecoveryCode';
import { EntryStep } from './steps/entry/EntryStep';
import { ConfirmMnemonicPhraseRecovery } from './steps/mnemonic-recovery/ConfirmMnemonicPhraseRecovery';
import { EnterMnemonicPhrase } from './steps/mnemonic-recovery/EnterMnemonicPhrase';
import { ResetPassword } from './steps/reset-password/ResetPassword';
import { ResetPasswordWithDataLoss } from './steps/reset-password/ResetPasswordWithDataLoss';
import { EnterSMSRecoveryCode } from './steps/sms-recovery/EnterSMSRecoveryCode';
import { VerifySMSRecoveryCode } from './steps/sms-recovery/VerifySMSRecoveryCode';
import { OtherLoggedInSessionPrompt } from './steps/unauthenticated-recovery/OtherLoggedInSessionPrompt';
import { ShowEmergencyContactsInstructions } from './steps/unauthenticated-recovery/ShowEmergencyContactsInstructions';
import { ShowSignedInResetSteps } from './steps/unauthenticated-recovery/ShowSignedInResetSteps';

export const forgotPasswordStepRegistry: Partial<Record<ForgotPasswordStatePath, ComponentType>> = {
    entry: EntryStep,
    verifyRecoveryEmail: VerifyEmailRecoveryCode,
    enterRecoverySms: EnterSMSRecoveryCode,
    verifyRecoverySms: VerifySMSRecoveryCode,
    'mnemonicRecovery.enterPhrase': EnterMnemonicPhrase,
    'mnemonicRecovery.confirmPhrase': ConfirmMnemonicPhraseRecovery,
    'unauthenticatedRecovery.otherSessionsPrompt': OtherLoggedInSessionPrompt,
    'unauthenticatedRecovery.activeSessionInstructions': ShowSignedInResetSteps,
    'unauthenticatedRecovery.emergencyContactInstructions': ShowEmergencyContactsInstructions,
    'authenticatedRecovery.otherSessionsPrompt': AuthenticatedSessionPrompt,
    'authenticatedRecovery.activeSessionInstructions': ShowSignedInResetSteps,
    'authenticatedRecovery.socialRecoveryOffer': SocialRecoveryStep,
    'authenticatedRecovery.emergencyAccessOffer': EmergencyAccessStep,
    'unauthenticatedRecovery.emergencyAccessOffer': EmergencyAccessStep,
    offerDataLossReset: ResetPasswordWithDataLoss,
    recoveryFailed: AccountLost,
    setNewPassword: ResetPassword,
};
