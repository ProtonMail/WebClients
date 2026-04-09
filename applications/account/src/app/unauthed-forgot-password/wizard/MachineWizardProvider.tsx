import { type ReactNode, createContext, useContext } from 'react';

import type { ActorRefFromLogic, AnyActorLogic, SnapshotFrom } from 'xstate';

type MachineWizardContextValue<M extends AnyActorLogic = AnyActorLogic> = {
    actorRef: ActorRefFromLogic<M>;
    snapshot: SnapshotFrom<M>;
    send: ActorRefFromLogic<M>['send'];
};

const MachineWizardContext = createContext<MachineWizardContextValue | null>(null);

export interface MachineWizardProviderProps<M extends AnyActorLogic = AnyActorLogic> {
    actorRef: ActorRefFromLogic<M>;
    snapshot: SnapshotFrom<M>;
    send: ActorRefFromLogic<M>['send'];
    children: ReactNode;
}

export function MachineWizardProvider<M extends AnyActorLogic>({
    actorRef,
    snapshot,
    send,
    children,
}: MachineWizardProviderProps<M>) {
    const value: MachineWizardContextValue<M> = { actorRef, snapshot, send };
    return <MachineWizardContext.Provider value={value}>{children}</MachineWizardContext.Provider>;
}

export function useMachineWizard<M extends AnyActorLogic = AnyActorLogic>(): MachineWizardContextValue<M> {
    const ctx = useContext(MachineWizardContext);
    if (!ctx) {
        throw new Error('useMachineWizard must be used within MachineWizardProvider');
    }
    return ctx as MachineWizardContextValue<M>;
}
