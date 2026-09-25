import type { ComponentType } from 'react';

import type { SignInStep } from './state-machine/SignInStateMachine';
import { CredentialsStep } from './steps/credentials/CredentialsStep';
import { PasswordAccountStep } from './steps/password-account/PasswordAccountStep';
import { SSOStep } from './steps/sso/SSOStep';

export const signInStepRegistry: Record<SignInStep, ComponentType> = {
    credentials: CredentialsStep,
    passwordAccount: PasswordAccountStep,
    sso: SSOStep,
};
