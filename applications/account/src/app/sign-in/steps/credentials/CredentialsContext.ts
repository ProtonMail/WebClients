import { createChildActorContext } from '../../wizard/createChildActorContext';
import type { credentialsStateMachine } from './state-machine/credentialsStateMachine';

/**
 * The credentials step's actor, run by the sign-in as its child. The forms and fields that use it sit a few levels
 * below the page (`SignInRoutes`), which provides it.
 */
export const CredentialsContext = createChildActorContext<typeof credentialsStateMachine>('CredentialsContext');
