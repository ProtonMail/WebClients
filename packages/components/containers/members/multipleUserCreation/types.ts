export type { UserTemplate } from '@proton/account/members/importUsers';

export interface ImportedCSVUser {
    Name: any;
    EmailAddresses: any;
    InvitationEmail: any;
    Password: any;
    TotalStorage: any;
    VPNAccess: any;
    PrivateSubUser: any;
}

export interface SampleCsvUser {
    Name: string;
    Password: string;
    InvitationEmail?: string;
    EmailAddresses: string;
    TotalStorage?: number;
    VPNAccess?: 1 | 0;
    PrivateSubUser?: 1 | 0;
}
