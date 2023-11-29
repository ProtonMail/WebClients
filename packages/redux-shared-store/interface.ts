import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { Api } from '@proton/shared/lib/interfaces';

export interface ProtonThunkArguments {
    api: Api;
    eventManager: EventManager;
}

export type ProtonDispatch<T> = ThunkDispatch<T, ProtonThunkArguments, AnyAction>;
