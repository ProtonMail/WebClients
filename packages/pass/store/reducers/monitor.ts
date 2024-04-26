import type { Reducer } from 'redux';

import {
    intoCustomMonitorAddress,
    intoMonitorDomain,
    intoProtonMonitorAddress,
} from '@proton/pass/lib/monitor/monitor.utils';
import type { AddressType, MonitorAddress, MonitorDomain } from '@proton/pass/lib/monitor/types';
import {
    addCustomAddress,
    getBreaches,
    resolveCustomBreach,
    resolveProtonBreach,
    verifyCustomAddress,
} from '@proton/pass/store/actions';
import { partialMerge } from '@proton/pass/utils/object/merge';

const INITIAL_MONITOR_STATE: MonitorState = { total: 0, proton: [], custom: [], preview: [] };

export type MonitorState = {
    custom: MonitorAddress<AddressType.CUSTOM>[];
    preview: MonitorDomain[];
    proton: MonitorAddress<AddressType.PROTON>[];
    total: number;
};

const monitorReducer: Reducer<MonitorState> = (state = INITIAL_MONITOR_STATE, action) => {
    if (getBreaches.success.match(action)) {
        return partialMerge(state, {
            custom: action.payload.CustomEmails?.map(intoCustomMonitorAddress) ?? [],
            preview: action.payload.DomainsPeek?.map(intoMonitorDomain) ?? [],
            proton: action.payload.Addresses?.map(intoProtonMonitorAddress) ?? [],
            total: action.payload.EmailsCount,
        });
    }

    if (resolveCustomBreach.success.match(action)) {
        return partialMerge(state, {
            custom: state.custom.map((breach) => {
                if (breach.addressId !== action.payload) return breach;
                return { ...breach, breachCount: 0 };
            }),
        });
    }

    if (resolveProtonBreach.success.match(action)) {
        return partialMerge(state, {
            proton: state.proton.map((breach) => {
                if (breach.addressId !== action.payload) return breach;
                return { ...breach, breachCount: 0 };
            }),
        });
    }

    if (addCustomAddress.success.match(action)) {
        return partialMerge(state, {
            custom: state.custom.concat(intoCustomMonitorAddress(action.payload)),
        });
    }

    if (verifyCustomAddress.success.match(action)) {
        return partialMerge(state, {
            custom: state.custom.map((breach) => {
                if (breach.addressId !== action.payload) return breach;
                return { ...breach, verified: true };
            }),
        });
    }

    return state;
};

export default monitorReducer;
