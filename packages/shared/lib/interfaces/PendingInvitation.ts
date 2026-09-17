export interface PendingInvitation {
    ID: string;
    InviterEmail: string;
    MaxSpace: number;
    OrganizationName: string;
    Validation: AcceptInvitationValidation;
}

export interface AcceptInvitationValidation {
    Valid: boolean;
    IsLifetimeAccount: boolean;
    HasSubscription: boolean;
    HasOrgWithMembers: boolean;
    HasCustomDomains: boolean;
    ExceedsMaxSpace: boolean;
    ExceedsAddresses: boolean;
    HasUnpaidInvoice: boolean;
    ExceedsMaxAcceptedInvitations: boolean;
    IsExternalUser: boolean;
}
