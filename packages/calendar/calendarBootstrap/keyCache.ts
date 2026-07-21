import type { SessionKey } from '@protontech/crypto';

import type { DecryptedCalendarKey } from '@proton/shared/lib/interfaces/calendar';

export interface DecryptedPassphraseAndCalendarKeysResult {
    decryptedCalendarKeys: DecryptedCalendarKey[];
    decryptedPassphrase: string;
    decryptedPassphraseSessionKey: SessionKey;
    passphraseID: string;
}

const map = new Map<string, Promise<DecryptedPassphraseAndCalendarKeysResult> | undefined>();

export const getCalendarKeyCache = () => map;

export const deleteCalendarFromKeyCache = (calendarID: string) => {
    map.delete(calendarID);
};
