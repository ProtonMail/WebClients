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
