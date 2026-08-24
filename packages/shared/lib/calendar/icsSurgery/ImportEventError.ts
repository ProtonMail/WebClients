import { getICSErrorMessage } from './errors/icsErrorMessageHelpers';
import type { IMPORT_EVENT_ERROR_TYPE } from './errors/icsSurgeryErrorTypes';
import type { EventComponentIdentifiers } from './interface';

export class ImportEventError extends Error {
    componentIdentifiers: EventComponentIdentifiers;

    type: IMPORT_EVENT_ERROR_TYPE;

    externalError?: Error;

    constructor({
        errorType,
        componentIdentifiers,
        externalError,
    }: {
        errorType: IMPORT_EVENT_ERROR_TYPE;
        componentIdentifiers: EventComponentIdentifiers;
        externalError?: Error;
    }) {
        super(getICSErrorMessage({ errorType, config: externalError, errorOrigin: 'import' }));
        this.type = errorType;
        this.componentIdentifiers = componentIdentifiers;
        this.externalError = externalError;
        Object.setPrototypeOf(this, ImportEventError.prototype);
    }
}
