export default class InvalidAddressesError extends Error {
    readonly invalidAddresses: string[];

    readonly orphanedAddresses: string[];

    constructor(
        /**
         * Addresses that are consider invalid through client side validation
         */
        invalidAddresses: string[],
        /**
         * Extra addresses for the user that was not created
         */
        orphanedAddresses: string[]
    ) {
        super();
        this.invalidAddresses = invalidAddresses;
        this.orphanedAddresses = orphanedAddresses;
        Object.setPrototypeOf(this, InvalidAddressesError.prototype);
    }
}
