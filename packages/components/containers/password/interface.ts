import type { Credentials, SrpConfig } from '@proton/shared/lib/srp';



export type AuthModalResult =
    | { type: 'sso'; response: Response }
    | {
          type: 'srp';
          credentials: Credentials;
          response: Response;
      };

export interface OwnAuthModalProps {
    config: SrpConfig;
    onSuccess?: (data: AuthModalResult) => Promise<void> | void;
    onCancel: (() => void) | undefined;
    onError?: (error: any) => void;
    prioritised2FAItem?: 'fido2' | 'totp';
    onRecoveryClick?: () => void;
}
