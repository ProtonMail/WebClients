import { SessionKey } from '@proton/crypto';

import { EVENT_VERIFICATION_STATUS } from '../../calendar/constants';
import { Address } from '../Address';
import { VcalAttendeeProperty, VcalVeventComponent } from './VcalModel';

export interface SelfAddressData {
    isOrganizer: boolean;
    isAttendee: boolean;
    selfAttendee?: VcalAttendeeProperty;
    selfAddress?: Address;
    selfAttendeeIndex?: number;
}

export interface CalendarEventEncryptionData {
    encryptingAddressID?: string;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
}

export type DecryptedVeventResult = {
    veventComponent: VcalVeventComponent;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    selfAddressData: SelfAddressData;
    encryptionData: CalendarEventEncryptionData;
};
export type DecryptedPersonalVeventMapResult = { [memberID: string]: DecryptedVeventResult | undefined };
