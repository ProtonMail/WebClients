import { EVENT_ACTIONS } from '../constants';

export interface BreachesCount {
    Count: number; //number of unread breach alerts
    Refresh: boolean;
}

export interface BreachAlertUpdateEvent {
    ID: string;
    Action: EVENT_ACTIONS;
}
