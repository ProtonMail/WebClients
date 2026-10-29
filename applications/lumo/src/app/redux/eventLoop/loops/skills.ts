import { syncSkills } from '../../../features/skills/skillSync';
import type { LumoEventLoopCallback } from '../interface';

export const skillsLoop: LumoEventLoopCallback = ({ event, dispatch }) => {
    if (!event.Refresh && !event.LumoSkills?.length) {
        return;
    }
    return dispatch(syncSkills());
};
