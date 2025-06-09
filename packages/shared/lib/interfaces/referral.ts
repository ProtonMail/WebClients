export interface ReferralData {
    /**
     * Identifier of the referring user who shared the referral link.
     * This is a Base32-encoded random string (e.g., "NJV4JCY7S4D0") that
     * uniquely identifies which existing user made the referral.
     * Required when signing up through any referral link.
     */
    referralIdentifier: string;
    /**
     * Optional encrypted ID of a specific email invitation.
     * This field is only provided when the user is signing up through
     * a direct email invitation link (as opposed to a general referral link).
     * Used to link the signup to the specific invitation record for
     * better tracking and analytics.
     */
    referralID?: string;
}
