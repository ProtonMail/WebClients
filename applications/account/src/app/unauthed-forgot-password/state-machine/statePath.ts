import type { StateValue } from 'xstate';

/**
 * Flattens XState `snapshot.value` to a dotted path (e.g. `{ mnemonicRecovery: 'enterPhrase' }` → `mnemonicRecovery.enterPhrase`).
 */
export function flattenStateValue<T>(value: StateValue): T {
    if (typeof value === 'string') {
        return value as T;
    }
    const entries = Object.entries(value);
    if (entries.length === 0) {
        return '' as T;
    }
    const [key, child] = entries[0];
    const childPath = flattenStateValue(child as StateValue);
    return (childPath ? `${key}.${childPath}` : key) as T;
}

/** Dotted paths produced by `flattenStateValue` for every renderable state in the forgot-password machine. */
export type ForgotPasswordStatePath =
    | 'entry'
    | 'verifyRecoveryEmail'
    | 'enterRecoverySms'
    | 'verifyRecoverySms'
    | 'checkDeviceRecovery'
    | 'mnemonicRecovery.checkMnemonic'
    | 'mnemonicRecovery.enterPhrase'
    | 'mnemonicRecovery.confirmPhrase'
    | 'authenticatedRecovery.checkOtherSessions'
    | 'authenticatedRecovery.otherSessionsPrompt'
    | 'authenticatedRecovery.activeSessionInstructions'
    | 'authenticatedRecovery.checkSocialRecovery'
    | 'authenticatedRecovery.socialRecoveryOffer'
    | 'authenticatedRecovery.emergencyAccessOffer'
    | 'unauthenticatedRecovery.otherSessionsPrompt'
    | 'unauthenticatedRecovery.activeSessionInstructions'
    | 'unauthenticatedRecovery.emergencyContactInstructions'
    | 'unauthenticatedRecovery.emergencyAccessOffer'
    | 'offerDataLossReset'
    | 'setNewPassword'
    | 'recoveryFailed'
    | 'doneHelpExit'
    | 'fatalError';
