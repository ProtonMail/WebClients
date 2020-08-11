// eslint-disable-next-line max-classes-per-file
export class InvalidPersistentSessionError extends Error {
    constructor(message?: string) {
        super(['Invalid persistent session', message].filter(Boolean).join(':'));
        Object.setPrototypeOf(this, InvalidPersistentSessionError.prototype);
    }
}

export class InvalidForkProduceError extends Error {
    constructor(message?: string) {
        super(['Invalid fork production', message].filter(Boolean).join(':'));
        Object.setPrototypeOf(this, InvalidForkProduceError.prototype);
    }
}

export class InvalidForkConsumeError extends Error {
    constructor(message?: string) {
        super(['Invalid fork consumption', message].filter(Boolean).join(':'));
        Object.setPrototypeOf(this, InvalidForkConsumeError.prototype);
    }
}
