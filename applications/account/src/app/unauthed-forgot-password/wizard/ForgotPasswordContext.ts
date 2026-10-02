import { createActorContext } from '@xstate/react';

import { UnauthedForgotPasswordStateMachine } from '../state-machine/UnauthedForgotPasswordStateMachine';

/** The forgot-password machine's actor; `ResetPasswordPage` provides it to the layout and the steps. */
export const ForgotPasswordContext = createActorContext(UnauthedForgotPasswordStateMachine);
