import { createChildActorContext } from '../../wizard/createChildActorContext';
import type { ssoStateMachine } from './state-machine/ssoStateMachine';

/** The SSO account flow's actor, run by the sign-in as its child; `SSOStep` provides it. */
export const SSOContext = createChildActorContext<typeof ssoStateMachine>('SSOContext');
