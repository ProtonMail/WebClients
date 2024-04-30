import type { Reducer } from 'redux';

import {
    intoCustomMonitorAddress,
    intoMonitorDomain,
    intoProtonMonitorAddress,
} from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType, type MonitorAddress, type MonitorDomain } from '@proton/pass/lib/monitor/types';
import {
    addCustomAddress,
    deleteCustomAddress,
    getBreaches,
    resolveAliasBreach,
    resolveCustomBreach,
    resolveProtonBreach,
    toggleAddressMonitor,
    verifyCustomAddress,
} from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';

export type MonitorState = MaybeNull<{
    custom: MonitorAddress<AddressType.CUSTOM>[];
    preview: MonitorDomain[];
    proton: MonitorAddress<AddressType.PROTON>[];
    customDomains: boolean;
    total: number;
}>;

const monitorReducer: Reducer<MonitorState> = (state = null, action) => {
    if (getBreaches.success.match(action)) {
        return {
            custom: action.payload.CustomEmails?.map(intoCustomMonitorAddress) ?? [],
            preview: action.payload.DomainsPeek?.map(intoMonitorDomain) ?? [],
            proton: action.payload.Addresses?.map(intoProtonMonitorAddress) ?? [],
            customDomains: action.payload.HasCustomDomains,
            total: action.payload.EmailsCount,
        };
    }

    if (state) {
        if (resolveCustomBreach.success.match(action)) {
            return partialMerge(state, {
                total: Math.max(0, state.total - 1),
                custom: state.custom.map((breach) => {
                    if (breach.addressId !== action.payload) return breach;
                    return { ...breach, breachCount: 0 };
                }),
            });
        }

        if (resolveProtonBreach.success.match(action)) {
            return partialMerge(state, {
                total: Math.max(0, state.total - 1),
                proton: state.proton.map((breach) => {
                    if (breach.addressId !== action.payload) return breach;
                    return { ...breach, breachCount: 0 };
                }),
            });
        }

        if (resolveAliasBreach.success.match(action)) {
            return partialMerge(state, { total: Math.max(0, state.total - 1) });
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

        if (deleteCustomAddress.success.match(action)) {
            return partialMerge(state, {
                custom: state.custom.filter((breach) => breach.addressId !== action.payload),
            });
        }

        if (toggleAddressMonitor.success.match(action)) {
            const type = action.payload.type;
            if (type === AddressType.ALIAS) return state;

            return partialMerge(state, {
                [type]: state[type].map((breach) =>
                    action.payload.type === AddressType.ALIAS || breach.addressId !== action.payload.addressId
                        ? breach
                        : action.payload
                ),
            });
        }
    }

    return state;
};

export default monitorReducer;
