import { Address } from '../Address';
import { VcalAttendeeProperty, VcalVeventComponent } from './VcalModel';
import { EVENT_VERIFICATION_STATUS } from '../../calendar/constants';

export interface SelfAddressData {
    selfAttendee?: VcalAttendeeProperty;
    selfAddress?: Address;
    selfAttendeeIndex?: number;
}

export type DecryptedVeventResult = {
    veventComponent: VcalVeventComponent;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    selfAddressData: SelfAddressData;
};
export type DecryptedPersonalVeventMapResult = { [memberID: string]: DecryptedVeventResult | undefined };
