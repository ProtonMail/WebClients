export interface SSO {
    SSOID: number;
    SSOURL: string;
    SSOEntityID: string;
    IssuerID: string;
    Certificate: string;
    DomainID: string;
    SCIMOauthClientID: string | null;
    Flags: number;
    CallbackURL: string;
}
