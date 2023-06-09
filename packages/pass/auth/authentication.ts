import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';

export let authentication: AuthenticationStore;
export const exposeAuthStore = (value: AuthenticationStore) => (authentication = value);
