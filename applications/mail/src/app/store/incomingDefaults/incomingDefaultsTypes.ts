import { IncomingDefault, IncomingDefaultStatus } from '@proton/shared/lib/interfaces';

export interface IncomingDefaultsState {
    list: IncomingDefault[];
    status: IncomingDefaultStatus;
}
