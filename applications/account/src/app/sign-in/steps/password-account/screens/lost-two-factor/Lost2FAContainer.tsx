import { useEffect } from 'react';

import { Lost2FAContext } from './Lost2FAContext';
import { Lost2FAScreens } from './Lost2FAScreens';
import { selectLost2FARecoveryMethods } from './state-machine/lost2FAStateMachine';
import { Lost2FATelemetryProvider, useLost2FATelemetryFunctions } from './useLost2FATelemetry';

export const Lost2FAContainer = () => {
    const actorRef = Lost2FAContext.useActorRef();
    const recoveryMethods = Lost2FAContext.useSelector(selectLost2FARecoveryMethods);
    const { sendStepLoad, sendFlowOutcome } = useLost2FATelemetryFunctions(recoveryMethods);

    useEffect(() => {
        const subscription = actorRef.on('outcome', (event) => sendFlowOutcome(event.outcome));
        return () => subscription.unsubscribe();
    }, [actorRef, sendFlowOutcome]);

    return (
        <Lost2FATelemetryProvider value={{ sendStepLoad, sendFlowOutcome }}>
            <Lost2FAScreens />
        </Lost2FATelemetryProvider>
    );
};
