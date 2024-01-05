export interface SSO {
    ID: string;
    SSOURL: string;
    SSOEntityID: string;
    IssuerID: string;
    Certificate: string;
    DomainID: string;
    SCIMOauthClientID: string | null;
    Flags: number;
    CallbackURL: string;
}
