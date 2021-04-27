import { DecryptedCalendarKey } from '../calendar';

export type GetDecryptedPassphraseAndCalendarKeys = (
    calendarID: string
) => Promise<{
    decryptedCalendarKeys: DecryptedCalendarKey[];
    decryptedPassphrase: string;
    passphraseID: string;
}>;
