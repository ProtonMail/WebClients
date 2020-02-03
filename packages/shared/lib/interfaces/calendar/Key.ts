import { KeyFlags } from '../../keys/calendarKeys';

export interface Key {
    ID: string;
    CalendarID: string;
    PrivateKey: string;
    PassphraseID: string;
    Flags: KeyFlags;
}
