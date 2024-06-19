export default class InvalidAddressesError extends Error {
    public trace = false;

    readonly invalidAddresses: string[];

    readonly orphanedAddresses: string[];

    readonly invalidInvitationAddresses: string[];

    constructor(
        /**
         * Addresses that are consider invalid through client side validation
         */
        invalidAddresses: string[],
        /**
         * Addresses that are consider invalid through client side validation
         */
        invalidInvitationAddresses: string[],
        /**
         * Extra addresses for the user that was not created
         */
        orphanedAddresses: string[]
    ) {
        super();
        this.invalidAddresses = invalidAddresses;
        this.invalidInvitationAddresses = invalidInvitationAddresses;
        this.orphanedAddresses = orphanedAddresses;
        Object.setPrototypeOf(this, InvalidAddressesError.prototype);
    }
}
