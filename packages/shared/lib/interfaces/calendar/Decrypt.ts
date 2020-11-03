import { EVENT_VERIFICATION_STATUS } from '../../calendar/interface';
import { Address } from '../Address';
import { VcalAttendeeProperty, VcalVeventComponent } from './VcalModel';

export interface SelfAttendeeData {
    selfAttendee?: VcalAttendeeProperty;
    selfAddress?: Address;
    selfAttendeeIndex?: number;
}

export type DecryptedVeventResult = {
    veventComponent: VcalVeventComponent;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    selfAttendeeData: SelfAttendeeData;
};
export type DecryptedPersonalVeventMapResult = { [memberID: string]: DecryptedVeventResult | undefined };
