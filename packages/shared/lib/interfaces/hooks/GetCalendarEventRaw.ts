import { EVENT_VERIFICATION_STATUS } from '../../calendar/constants';
import { CalendarEvent, CalendarEventEncryptionData, SelfAddressData, VcalVeventComponent } from '../calendar';

export type GetCalendarEventRaw = (Event: CalendarEvent) => Promise<{
    veventComponent: VcalVeventComponent;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    selfAddressData: SelfAddressData;
    encryptionData: CalendarEventEncryptionData;
}>;
