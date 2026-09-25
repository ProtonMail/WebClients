import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { AuthResponse, AuthVersion } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type {
    Api,
    KeyMigrationKTVerifier,
    KeyTransparencyActivation,
    PreAuthKTVerifier,
} from '@proton/shared/lib/interfaces';

/**
 * What the sign-in steps need besides account data: the first authentication and the app's services.
 * Built from the auth state for each call and never mutated; account data (user, salts, addresses) is passed
 * explicitly.
 */
export interface LoginFlowContext {
    api: Api;
    appName: APP_NAMES;
    productParam: ProductParam;
    username: string;
    persistent: boolean;
    authResponse: AuthResponse;
    authVersion: AuthVersion;
    ktActivation: KeyTransparencyActivation;
    preAuthKTVerifier: PreAuthKTVerifier;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
}
