export class SilentError extends Error {}

export class NoDefaultVaultError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoDefaultVaultError';
    }
}
