import type { Reducer } from 'redux';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
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
    resolveAddressMonitor,
    toggleAddressMonitor,
    verifyCustomAddress,
} from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import lastItem from '@proton/utils/lastItem';

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
        if (addCustomAddress.success.match(action)) {
            return partialMerge(state, {
                custom: state.custom.concat(intoCustomMonitorAddress(action.payload)),
            });
        }

        if (verifyCustomAddress.success.match(action)) {
            return partialMerge(state, {
                custom: state.custom.map((breach) => {
                    if (breach.addressId !== action.payload.addressId) return breach;
                    return action.payload;
                }),
            });
        }

        if (verifyCustomAddress.failure.match(action)) {
            const addressId = lastItem(action.meta.request.id.split('::'));
            if (action.payload.code === PassErrorCode.NOT_ALLOWED && addressId) {
                return partialMerge(state, { custom: state.custom.filter((breach) => breach.addressId !== addressId) });
            }
        }

        if (deleteCustomAddress.success.match(action)) {
            return partialMerge(state, {
                custom: state.custom.filter((breach) => breach.addressId !== action.payload),
            });
        }

        if (resolveAddressMonitor.success.match(action)) {
            const dto = action.payload;

            switch (dto.type) {
                case AddressType.ALIAS: {
                    return partialMerge(state, { total: Math.max(0, state.total - 1) });
                }

                case AddressType.CUSTOM: {
                    const address = state.custom.find(({ addressId }) => addressId === dto.addressId);
                    if (!address) return state;

                    return partialMerge(state, {
                        total: Math.max(0, state.total - (address?.breachCount ?? 0)),
                        custom: state.custom.map((breach) => {
                            if (breach.addressId !== dto.addressId) return breach;
                            return { ...breach, breachCount: 0, breached: false };
                        }),
                    });
                }

                case AddressType.PROTON: {
                    const address = state.proton.find(({ addressId }) => addressId === dto.addressId);
                    if (!address) return state;

                    return partialMerge(state, {
                        total: Math.max(0, state.total - (address?.breachCount ?? 0)),
                        proton: state.proton.map((breach) => {
                            if (breach.addressId !== dto.addressId) return breach;
                            return { ...breach, breachCount: 0, breached: false };
                        }),
                    });
                }
            }
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
