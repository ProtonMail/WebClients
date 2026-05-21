import type { Api } from '@proton/shared/lib/interfaces';
import type { LumoEventResponse } from '@proton/shared/lib/interfaces/Lumo';

import type { LumoDispatch, LumoState } from '../store';

export type LumoEventLoopRequiredState = LumoState;

export type LumoEventLoopCallback = (args: {
    event: LumoEventResponse;
    state: LumoEventLoopRequiredState;
    dispatch: LumoDispatch;
    api: Api;
}) => void | Promise<unknown>;
