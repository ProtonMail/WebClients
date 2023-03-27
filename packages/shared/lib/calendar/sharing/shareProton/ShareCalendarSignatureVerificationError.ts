export class ShareCalendarSignatureVerificationError extends Error {
    senderEmail: string;

    errors?: Error[];

    constructor(senderEmail: string, errors?: Error[]) {
        super('Authenticity of calendar invite could not be verified');
        this.senderEmail = senderEmail;
        this.errors = errors;
        Object.setPrototypeOf(this, ShareCalendarSignatureVerificationError.prototype);
    }
}
