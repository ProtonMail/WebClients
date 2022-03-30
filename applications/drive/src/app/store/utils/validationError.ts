export function isValidationError(err: any): boolean {
    return err.name === 'ValidationError';
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
