export interface UserTemplate {
    id: string;
    emailAddresses: string[];
    password: string;
    displayName: string;
    totalStorage: number;
    vpnAccess: boolean;
    privateSubUser: boolean;
}

export interface ImportedCSVUser {
    EmailAddresses: any;
    Password: any;
    DisplayName: any;
    TotalStorage: any;
    VPNAccess: any;
    PrivateSubUser: any;
}

export interface ExportedCSVUser {
    EmailAddresses: string;
    Password: string;
    DisplayName: string;
    TotalStorage: number;
    VPNAccess: 1 | 0;
    PrivateSubUser: 1 | 0;
}

export interface ExportedVpnB2BCSVUser {
    EmailAddress: string;
    Password: string;
    Name: string;
}
