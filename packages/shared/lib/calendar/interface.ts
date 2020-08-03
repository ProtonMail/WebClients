import { OpenPGPSignature } from 'pmcrypto';
import { VcalAttendeeProperty, VcalAttendeePropertyParameters } from '../interfaces/calendar/VcalModel';
import { ATTENDEE_STATUS_API } from './constants';

export interface EncryptPartResult {
    dataPacket: Uint8Array;
    signature: OpenPGPSignature;
}

export interface SignPartResult {
    data: string;
    signature: OpenPGPSignature;
}

export interface AttendeeClearPartResult {
    permissions: number;
    status: ATTENDEE_STATUS_API;
    token: string;
}

interface AttendeeParameters extends VcalAttendeePropertyParameters {
    'x-pm-token': string;
}
export interface AttendeePart extends VcalAttendeeProperty {
    parameters: AttendeeParameters;
}

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;
