export class PasskeyServiceError extends Error {
    name = 'PasskeyError';

    /** If `true` - we should let the user fallback
     * to the browser's default WebAuthN flow. */
    public allowNativeWebAuthn: boolean;

    constructor(options: { allowNativeWebAuthn: boolean }) {
        super('PasskeyError');
        this.allowNativeWebAuthn = options.allowNativeWebAuthn;
    }
}
