import type { SessionKey } from '@proton/crypto';

import type { EVENT_VERIFICATION_STATUS } from '../../calendar/constants';
import type { Address } from '../Address';
import type { VcalAttendeeProperty, VcalVeventComponent } from './VcalModel';

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
    hasDefaultNotifications: boolean;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    selfAddressData: SelfAddressData;
    encryptionData: CalendarEventEncryptionData;
};
