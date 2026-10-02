import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { OnLoginCallback } from '../content/authSession';
import { forgotPasswordStepRegistry } from './forgotPasswordStepRegistry';
import type { UnauthedForgotPasswordStateMachine } from './state-machine/UnauthedForgotPasswordStateMachine';
import type { ForgotPasswordStatePath } from './state-machine/statePath';
import { flattenStateValue } from './state-machine/statePath';
import { ForgotPasswordProvider } from './wizard/ForgotPasswordProvider';
import type { MachineWizardProviderProps } from './wizard/MachineWizardProvider';
import { MachineWizardProvider } from './wizard/MachineWizardProvider';
import type { ForgotPasswordStepProps } from './wizard/forgotPasswordStep';

export const UnauthedForgotPasswordWizard = ({
    actorRef,
    send,
    snapshot,
    onBack,
    onPreSubmit,
    onStartAuth,
    onLogin,
    productParam,
    setupVPN,
}: Omit<MachineWizardProviderProps, 'children'> &
    ForgotPasswordStepProps & {
        onLogin: OnLoginCallback;
        setupVPN: boolean;
        productParam: ProductParam;
        onPreSubmit: () => Promise<void>;
        onStartAuth: () => Promise<void>;
    }) => {
    const path: ForgotPasswordStatePath = flattenStateValue<ForgotPasswordStatePath>(snapshot.value);
    const Step = forgotPasswordStepRegistry[path];

    return (
        <MachineWizardProvider<typeof UnauthedForgotPasswordStateMachine>
            actorRef={actorRef}
            snapshot={snapshot}
            send={send}
        >
            <ForgotPasswordProvider
                onLogin={onLogin}
                onPreSubmit={onPreSubmit}
                onStartAuth={onStartAuth}
                productParam={productParam}
                setupVPN={setupVPN}
            >
                {Step ? <Step onBack={onBack} /> : null}
            </ForgotPasswordProvider>
        </MachineWizardProvider>
    );
};
