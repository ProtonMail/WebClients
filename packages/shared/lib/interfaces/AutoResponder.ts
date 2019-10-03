import { AutoReplyDuration } from '../constants';

export interface AutoResponder {
    IsEnabled: boolean;
    Message: string;
    Repeat: AutoReplyDuration;
    DaysSelected: number[];
    Zone: string;
    Subject: string;
}
