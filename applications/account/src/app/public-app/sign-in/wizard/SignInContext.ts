import { createActorContext } from '@xstate/react';

import { SignInStateMachine } from '../state-machine/SignInStateMachine';

export const SignInContext = createActorContext(SignInStateMachine);
