export function isValidationError(err: any): err is ValidationError {
    return err.name === 'ValidationError';
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
