import type { PLANS } from '@proton/payments';

export interface PendingInvitation {
    ID: string;
    InviterEmail: string;
    MaxSpace: number;
    OrganizationName: string;
    Validation: AcceptInvitationValidation;
    OrganizationPlanName?: PLANS;
}

export interface AcceptInvitationValidation {
    Valid: boolean;
    IsLifetimeAccount: boolean;
    IsOnForbiddenPlan: boolean;
    HasOrgWithMembers: boolean;
    HasCustomDomains: boolean;
    ExceedsMaxSpace: boolean;
    ExceedsAddresses: boolean;
    HasUnpaidInvoice: boolean;
    ExceedsMaxAcceptedInvitations: boolean;
    IsExternalUser: boolean;
}
