export class ImportEventGeneralError extends Error {
    error: Error;

    component: string;

    idMessage: string;

    constructor(error: Error, component: string, idMessage: string) {
        super(error.message);
        this.error = error;
        this.component = component;
        this.idMessage = idMessage;
        Object.setPrototypeOf(this, ImportEventGeneralError.prototype);
    }
}
