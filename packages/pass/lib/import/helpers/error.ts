import { c } from 'ttag';

export class ImportReaderError extends Error {}

export class ImportProviderError extends Error {
    constructor(provider: string, err: unknown) {
        const errorDetail = err instanceof ImportReaderError ? `(${err.message})` : '';
        super(c('Error').t`${provider} file could not be parsed. ${errorDetail}`);
    }
}
