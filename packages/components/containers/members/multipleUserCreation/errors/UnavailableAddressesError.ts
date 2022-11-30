export default class UnavailableAddressesError extends Error {
    readonly unavailableAddresses: string[];

    readonly orphanedAddresses: string[];

    constructor(
        /**
         * Addresses that are not available for use
         */
        unavailableAddresses: string[],
        /**
         * Extra addresses for the user that was not created
         */
        orphanedAddresses: string[]
    ) {
        super();
        this.unavailableAddresses = unavailableAddresses;
        this.orphanedAddresses = orphanedAddresses;
        Object.setPrototypeOf(this, UnavailableAddressesError.prototype);
    }
}
