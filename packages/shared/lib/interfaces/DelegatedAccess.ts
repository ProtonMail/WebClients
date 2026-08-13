/** Delegated access states applicable to both incoming or outgoing delegated access */
export enum DelegatedAccessStateEnum {
    Disabled = 0,
    Enabled = 1,
    /** (Emergency access only) the contact/user has been granted access */
    Accessible = 2,
    /** (Social recovery only) the contact/user has been asked to help with key re-activation  */
    Recoverable = 3,
}

export enum DelegatedAccessTypeEnum {
    EmergencyAccess = 1,
    SocialRecovery = 2,
}
