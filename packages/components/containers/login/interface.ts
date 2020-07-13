import { User as tsUser } from 'proton-shared/lib/interfaces';

export interface OnLoginArgs {
    UID: string;
    User?: tsUser;
    keyPassword?: string;
    EventID: string;
}
