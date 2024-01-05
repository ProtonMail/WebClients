export interface SSO {
    ID: number;
    SSOURL: string;
    SSOEntityID: string;
    IssuerID: string;
    Certificate: string;
    DomainID: string;
    SCIMOauthClientID: string | null;
    Flags: number;
    CallbackURL: string;
}
