import { CalendarSettings, DecryptedCalendarKey } from '../calendar';
import { DecryptedKey } from '../Key';

export type GetCalendarInfo = (
    ID: string
) => Promise<{
    memberID: string;
    addressKeys: DecryptedKey[];
    decryptedCalendarKeys: DecryptedCalendarKey[];
    calendarSettings: CalendarSettings;
    decryptedPassphrase: string;
    passphraseID: string;
}>;
