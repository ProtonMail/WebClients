export class SilentError extends Error {}

/** The user dismissed the OS prompt. Not a failed attempt. */
export class UnlockDeclinedError extends SilentError {}

/** The OS prompt failed (device unavailable, too many attempts...). Its message is safe to show. */
export class UnlockFailedError extends Error {}

export class NoDefaultVaultError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoDefaultVaultError';
    }
}
