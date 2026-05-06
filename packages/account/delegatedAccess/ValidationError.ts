class ValidationError extends Error {
    public trace = false;
    public email = '';
    constructor(message: string, email: string) {
        super(message);
        this.name = 'DelegatedAccessValidationError';
        this.email = email;
    }
}

export default ValidationError;
