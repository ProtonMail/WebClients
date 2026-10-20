import type { IncomingDefault, IncomingDefaultStatus } from '@proton/shared/lib/interfaces/IncomingDefault';

export interface IncomingDefaultsState {
    list: IncomingDefault[];
    status: IncomingDefaultStatus;
}
