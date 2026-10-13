import { SupportedActions } from '../../../helper';

/**
 * Current state of the BYOE flow:
 * - `idle`: regular view, no OAuth flow in progress
 * - `auto-starting`: the native app asked to skip the view and starting OAuth automatically.
 * - `starting-oauth`: the user pressed connect and the page is about to navigate to the provider.
 * - `connecting`: back from the provider, the address is being created.
 */
export type BYOEMobileStatus = 'idle' | 'auto-starting' | 'starting-oauth' | 'connecting';

// Google sends the user back here after consent. This exact URL must be allowlisted on the Google OAuth client.
export const REDIRECT_PATH = `/lite?action=${SupportedActions.BYOEMobile}`;
