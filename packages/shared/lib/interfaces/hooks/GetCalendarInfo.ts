import { CalendarSettings, DecryptedCalendarKey } from '../calendar';
import { DecryptedKey } from '../Key';

export type GetDecryptedPassphraseAndCalendarKeys = (
    calendarID: string
) => Promise<{
    memberID: string;
    addressKeys: DecryptedKey[];
    calendarSettings: CalendarSettings;
    decryptedCalendarKeys: DecryptedCalendarKey[];
    decryptedPassphrase: string;
    passphraseID: string;
}>;
