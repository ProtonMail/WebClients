import { ATTENDEE_STATUS_API } from '../../calendar/constants';
import { VcalAttendeeProperty, VcalAttendeePropertyParameters } from './VcalModel';

export interface AttendeeClearPartResult {
    status: ATTENDEE_STATUS_API;
    token: string;
}

interface AttendeeParameters extends VcalAttendeePropertyParameters {
    'x-pm-token': string;
}
export interface AttendeePart extends VcalAttendeeProperty {
    parameters: AttendeeParameters;
}
