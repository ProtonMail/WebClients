interface Unavailable {
    message: string;
    address: string;
}

export default class UnavailableAddressesError extends Error {
    public trace = false;

    readonly unavailableAddresses: Unavailable[];

    readonly orphanedAddresses: string[];

    constructor(
        /**
         * Addresses that are not available for use
         */
        unavailableAddresses: Unavailable[],
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
