import { INCOMING_DEFAULTS_LOCATION } from '../constants';

export interface IncomingDefault {
    ID: string;
    Email?: string;
    Domain?: string;
    Location: INCOMING_DEFAULTS_LOCATION;
    Type: number;
    Time: number;
}

export type IncomingDefaultStatus = 'not-loaded' | 'pending' | 'loaded' | 'rejected';
