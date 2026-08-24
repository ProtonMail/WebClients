import type { SyncEventListOutput } from '../../../types';
import { api } from '../../api/api';

/** Retrieves the latest user event ID */
export const getUserEventLatestID = async (): Promise<string> => {
    const res = await api({ url: `pass/v1/user/sync_event`, method: 'get' });
    return res.EventID;
};

/** Retrieves all user events since `lastEventID` */
export const getUserEventsSince = async (lastEventID: string): Promise<SyncEventListOutput> => {
    const res = await api({ url: `pass/v1/user/sync_event/${lastEventID}`, method: 'get' });
    return res.Events;
};
