import type { OnLoginCallback } from '@proton/components/containers/app/interface';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import { forgotPasswordStepRegistry } from './forgotPasswordStepRegistry';
import type { UnauthedForgotPasswordStateMachine } from './state-machine/UnauthedForgotPasswordStateMachine';
import type { ForgotPasswordStatePath } from './state-machine/statePath';
import { flattenStateValue } from './state-machine/statePath';
import { ForgotPasswordProvider } from './wizard/ForgotPasswordProvider';
import type { MachineWizardProviderProps } from './wizard/MachineWizardProvider';
import { MachineWizardProvider } from './wizard/MachineWizardProvider';

export const UnauthedForgotPasswordWizard = ({
    actorRef,
    send,
    snapshot,
    onPreSubmit,
    onStartAuth,
    onLogin,
    productParam,
    setupVPN,
}: Omit<MachineWizardProviderProps, 'children'> & {
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
                {Step ? <Step /> : null}
            </ForgotPasswordProvider>
        </MachineWizardProvider>
    );
};
