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
    Name: any;
    EmailAddresses: any;
    Password: any;
    TotalStorage: any;
    VPNAccess: any;
    PrivateSubUser: any;
}

export interface SampleCsvUser {
    Name: string;
    Password: string;
    EmailAddresses: string;
    TotalStorage?: number;
    VPNAccess?: 1 | 0;
    PrivateSubUser?: 1 | 0;
}
