import * as React from 'react';
import { Address } from '@proton/shared/lib/interfaces/Address';

export enum Status {
    QUEUED,
    DONE,
    FAILURE,
    LOADING,
}

export interface AddressWithStatus extends Address {
    status: {
        type: Status;
        tooltip?: string;
    };
}

export type SetFormattedAddresses = React.Dispatch<React.SetStateAction<AddressWithStatus[]>>;
