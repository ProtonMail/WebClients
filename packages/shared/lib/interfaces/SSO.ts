export interface SSO {
    ID: string;
    SSOURL: string;
    SSOEntityID: string;
    Certificate: string;
    DomainID: string;
    SCIMOauthClientID: string | null;
    Flags: number;
}
