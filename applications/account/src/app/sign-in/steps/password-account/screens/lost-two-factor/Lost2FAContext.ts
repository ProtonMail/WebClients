import { createChildActorContext } from '../../../../wizard/createChildActorContext';
import type { lost2FAStateMachine } from './state-machine/lost2FAStateMachine';

/** The lost-2FA flow's actor, run by the password account flow as its child; `LostTwoFactorScreen` provides it. */
export const Lost2FAContext = createChildActorContext<typeof lost2FAStateMachine>('Lost2FAContext');
