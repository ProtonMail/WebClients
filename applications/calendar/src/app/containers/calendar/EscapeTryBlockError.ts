export class EscapeTryBlockError extends Error {
    recursive: boolean;

    constructor(recursive = false) {
        super('Escape block error');
        this.recursive = recursive;
        Object.setPrototypeOf(this, EscapeTryBlockError.prototype);
    }
}
