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
    IsOnForbiddenPlan: boolean;
    HasOrgWithMembers: boolean;
    HasCustomDomains: boolean;
    ExceedsMaxSpace: boolean;
    ExceedsAddresses: boolean;
    ExceedsMaxAcceptedInvitations: boolean;
    IsExternalUser: boolean;
}
