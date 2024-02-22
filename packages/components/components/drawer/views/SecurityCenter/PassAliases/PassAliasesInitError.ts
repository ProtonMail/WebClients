export const FAILED_TO_INIT_PASS_BRIDGE_ERROR = 'PassAliasesInitError';

export class PassAliasesInitError extends Error {
    constructor(error: Error) {
        super(`${error?.name ? error.name + ': ' : ''} ${error?.message ? error.message : ''}`);
        this.name = FAILED_TO_INIT_PASS_BRIDGE_ERROR;
        this.stack = error.stack;
    }
}

export default PassAliasesInitError;
