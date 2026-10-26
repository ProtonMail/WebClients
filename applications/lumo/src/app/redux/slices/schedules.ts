import type { Dispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { generateSpaceKeyBase64 } from '../../crypto';
import type { ScheduleDetails } from '../../features/schedules/types';
import type { Space, SpaceId } from '../../types';
import { SpaceType } from '../../types';
import type { LumoState } from '../store';
import { addSpace, locallyDeleteSpaceFromLocalRequest, pushSpaceRequest } from './core/spaces';

/** Redux thunk to save a schedule through the existing encrypted space persistence and sync pipeline. */
export const saveSchedule =
    (id: SpaceId, schedule: ScheduleDetails, mode: 'create' | 'edit' = 'create') =>
    (dispatch: Dispatch, getState: () => LumoState): SpaceId => {
        const existing = getState().spaces[id];
        if (mode === 'edit' ? existing?.spaceType !== SpaceType.Schedule : existing !== undefined) {
            // translator: Thrown when saving edits to a schedule that was deleted or is no longer a schedule space.
            throw new Error(
                c('collider_2025:Error').t`This scheduled task no longer exists. Reload the page and try again.`
            );
        }
        const now = new Date().toISOString();
        const space: Space = {
            id,
            spaceType: SpaceType.Schedule,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            spaceKey: existing?.spaceKey ?? generateSpaceKeyBase64(),
            schedule,
        };
        dispatch(addSpace(space));
        dispatch(pushSpaceRequest({ id }));
        return id;
    };

/** Redux thunk to delete a schedule through the existing space persistence pipeline. */
export const deleteSchedule =
    (id: SpaceId) =>
    (dispatch: Dispatch, getState: () => LumoState): void => {
        if (getState().spaces[id]?.spaceType === SpaceType.Schedule) {
            dispatch(locallyDeleteSpaceFromLocalRequest(id));
        }
    };
