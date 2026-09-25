import type {
    AuthSession as BaseAuthSession,
    OnLoginCallbackResult,
} from '@proton/components/containers/app/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

export type { OnLoginCallbackResult };

export type AuthFlows = 'signup' | 'reset' | 'switch' | 'login' | 'auto-resume' | undefined;

export type AuthInterruption = 'fork-redirect-consent' | 'oauth-consent' | 'reauth';

export interface AppIntent {
    app: APP_NAMES;
    ref?: 'product-switch';
}

/** A signed-in session with what the account app tracks about how it got there and where it goes next. */
export interface AuthSession extends BaseAuthSession {
    flow?: AuthFlows;
    /** Interruptions this session has already been through, in the order they happened */
    interruptions?: AuthInterruption[];
    appIntent?: AppIntent;
}

export type OnLoginCallbackArguments = AuthSession;
export type OnLoginCallback = (data: OnLoginCallbackArguments) => Promise<OnLoginCallbackResult>;
