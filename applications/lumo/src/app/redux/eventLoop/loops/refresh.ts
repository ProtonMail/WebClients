import { pullSpacesRequest } from '../../slices/core/spaces';
import type { LumoEventLoopCallback } from '../interface';

export const refreshLoop: LumoEventLoopCallback = ({ event, dispatch }) => {
    if (event.Refresh) {
        dispatch(pullSpacesRequest());
    }
};
