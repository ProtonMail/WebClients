import { DAILY_TYPE, END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE, YEARLY_TYPE } from '../constants';

export interface FrequencyModel {
    type: FREQUENCY;
    frequency: FREQUENCY;
    interval: number;
    daily: {
        type: DAILY_TYPE;
    };
    weekly: {
        type: WEEKLY_TYPE;
        days: number[];
    };
    monthly: {
        type: MONTHLY_TYPE;
    };
    yearly: {
        type: YEARLY_TYPE;
    };
    ends: {
        type: END_TYPE;
        count: number;
        until?: Date;
    };
}

// todo
export interface AttendeeModel {
    name: string;
    email: string;
    permissions: any;
    rsvp: string;
}

export interface DateTimeModel {
    date: Date;
    time: Date;
    tzid: string;
}

export interface EventModel {
    uid?: string;
    frequencyModel: FrequencyModel;
    title: string;
    location: string;
    description: string;
    //attendees: AttendeeModel[];
    start: DateTimeModel;
    end: DateTimeModel;
    rest: any;
}
