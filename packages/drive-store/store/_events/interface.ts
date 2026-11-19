import type { EVENT_ACTIONS } from '@proton/shared/lib/constants';

export type DriveCoreEvent = {
    DriveShareRefresh?: {
        Action: EVENT_ACTIONS;
    };
    More: 1 | 0;
    EventID: string;
};
