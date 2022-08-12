import { DecryptedKey } from '../Key';
import { CalendarSettings, DecryptedCalendarKey } from '../calendar';

export type GetCalendarInfo = (ID: string) => Promise<{
    memberID: string;
    addressID: string;
    addressKeys: DecryptedKey[];
    calendarKeys: DecryptedCalendarKey[];
    calendarSettings: CalendarSettings;
    passphrase: string;
    passphraseID: string;
}>;
