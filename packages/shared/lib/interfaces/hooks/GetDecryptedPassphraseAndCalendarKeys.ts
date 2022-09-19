import { SessionKey } from '@proton/crypto';

import { DecryptedCalendarKey } from '../calendar';

export type GetDecryptedPassphraseAndCalendarKeys = (calendarID: string) => Promise<{
    decryptedCalendarKeys: DecryptedCalendarKey[];
    decryptedPassphrase: string;
    decryptedPassphraseSessionKey: SessionKey;
    passphraseID: string;
}>;
