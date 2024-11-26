export class ESError extends Error {
    constructor(
        message: string,
        public cause?: Error
    ) {
        super(message, cause);
        this.name = 'ESError';
    }
}

export class ESDecryptionError extends ESError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ESDecryptionError';
    }
}

export class ESParseError extends ESError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ESParseError';
    }
}

export class ESTransactionError extends ESError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ESTransactionError';
    }
}

export class ESTransactionInactiveError extends ESTransactionError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ESTransactionInactiveError';
    }
}

export class ESInvalidStateError extends ESTransactionError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ESInvalidStateError';
    }
}

export class ESInvalidAccessError extends ESTransactionError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ESInvalidAccessError';
    }
}

export class ESDbTableNotFound extends ESError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ESDbTableNotFound';
    }
}
