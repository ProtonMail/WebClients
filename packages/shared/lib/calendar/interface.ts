import { OpenPGPSignature } from 'pmcrypto';
import { VcalAttendeeProperty, VcalAttendeePropertyParameters } from '../interfaces/calendar/VcalModel';

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
    token: string;
}

interface AttendeeParameters extends VcalAttendeePropertyParameters {
    'x-pm-token': string;
}
export interface AttendeePart extends VcalAttendeeProperty {
    parameters: AttendeeParameters;
}
