import { ActionEventV6 } from '@proton/shared/lib/api/events';

import { resetLumoUserSettings } from '../../slices/lumoUserSettings';
import { refreshLumoUserSettings } from '../../slices/lumoUserSettingsActions';
import type { LumoEventLoopCallback } from '../interface';

export const lumoUserSettingsLoop: LumoEventLoopCallback = ({ event, dispatch }) => {
    const events = event.LumoUserSettings;
    if (!events?.length) {
        return;
    }

    const hasDelete = events.some(({ Action }) => Action === ActionEventV6.Delete);
    const hasUpsert = events.some(({ Action }) => Action === ActionEventV6.Create || Action === ActionEventV6.Update);

    if (hasDelete && !hasUpsert) {
        dispatch(resetLumoUserSettings());
        return;
    }

    dispatch(refreshLumoUserSettings());
};
