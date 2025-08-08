import type { SetMnemonicPhrasePayload } from '@proton/shared/lib/api/settingsMnemonic';

export type RecoveryKitBlob = Blob;

/**
 * All the data required to display the recovery phrase, download the recovery kit, and ensure the BE is happy.
 */
export interface DeferredMnemonicData {
    /**
     * 12 word recovery phrase
     */
    recoveryPhrase: string;
    /**
     * Blob of the pdf that will be downloaded.
     * Will be null if an error occured while generating.
     */
    recoveryKitBlob: RecoveryKitBlob | null;
    /**
     * Payload to be sent to the BE.
     * Handled by the sendMnemonicPayloadToBackend function
     */
    payload: SetMnemonicPhrasePayload;
}
