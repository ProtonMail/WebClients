import type { Credentials, SrpConfig } from '@proton/shared/lib/srp';

export interface SrpAuthModalResult {
    type: 'srp';
    credentials: Credentials;
    response: Response;
}

export interface SSOAuthModalResult {
    type: 'sso';
    credentials: {
        ssoReauthToken: string;
    };
    response: Response;
}

export type AuthModalResult = SrpAuthModalResult | SSOAuthModalResult;

export interface OwnAuthModalProps {
    config: SrpConfig;
    onSuccess?: (data: AuthModalResult) => Promise<void> | void;
    onCancel: (() => void) | undefined;
    onError?: (error: any) => void;
    prioritised2FAItem?: 'fido2' | 'totp';
    onRecoveryClick?: () => void;
    scope: 'password' | 'locked';
}
