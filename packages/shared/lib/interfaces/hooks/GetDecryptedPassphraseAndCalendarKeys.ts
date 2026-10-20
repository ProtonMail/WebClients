import type { SessionKey } from '@protontech/crypto';

import type { DecryptedCalendarKey } from '../calendar/CalendarKey';

export type GetDecryptedPassphraseAndCalendarKeys = (calendarID: string) => Promise<{
    decryptedCalendarKeys: DecryptedCalendarKey[];
    decryptedPassphrase: string;
    decryptedPassphraseSessionKey: SessionKey;
    passphraseID: string;
}>;
