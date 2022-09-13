export default class UnavailableAddressesError extends Error {
    readonly addresses: string[];

    constructor(addresses: string[]) {
        super();
        this.addresses = addresses;
        Object.setPrototypeOf(this, UnavailableAddressesError.prototype);
    }
}
