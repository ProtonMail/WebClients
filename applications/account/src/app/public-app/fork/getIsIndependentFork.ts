import { type ProduceForkData, SSOType } from '../actions/forkInterface';

export const getIsIndependentFork = (forkState: ProduceForkData | null) =>
    forkState?.type === SSOType.Proton &&
    (Boolean(forkState.payload.desktopForkParameters) || forkState.payload.forkParameters.independent);
