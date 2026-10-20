import type { EVENT_VERIFICATION_STATUS } from '../../calendar/constants';
import type { CalendarEventEncryptionData, SelfAddressData } from '../calendar/Decrypt';
import type { CalendarEvent } from '../calendar/Event';
import type { VcalVeventComponent } from '../calendar/VcalModel';

export type GetCalendarEventRaw = (Event: CalendarEvent) => Promise<{
    veventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    selfAddressData: SelfAddressData;
    encryptionData: CalendarEventEncryptionData;
}>;
