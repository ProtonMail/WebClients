export default class InvalidAddressesError extends Error {
    readonly addresses: string[];

    constructor(addresses: string[]) {
        super();
        this.addresses = addresses;
        Object.setPrototypeOf(this, InvalidAddressesError.prototype);
    }
}
