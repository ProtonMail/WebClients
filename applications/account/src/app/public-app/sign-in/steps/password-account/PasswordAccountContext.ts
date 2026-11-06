import { createChildActorContext } from '../../wizard/createChildActorContext';
import type { passwordAccountStateMachine } from './state-machine/passwordAccountStateMachine';

/** The password account flow's actor, run by the sign-in as its child; the page (`SignInRoutes`) provides it. */
export const PasswordAccountContext =
    createChildActorContext<typeof passwordAccountStateMachine>('PasswordAccountContext');
