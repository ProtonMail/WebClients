export enum OAUTH_PROVIDER {
    GOOGLE = 1,
}

export interface OAuthProps {
    code: string;
    provider: OAUTH_PROVIDER;
    redirectURI: string;
}
