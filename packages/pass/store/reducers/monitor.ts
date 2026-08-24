import type { Reducer } from 'redux';

import lastItem from '@proton/utils/lastItem';

import { PassErrorCode } from '../../lib/api/errors';
import { intoCustomMonitorAddress, intoMonitorDomain, intoProtonMonitorAddress } from '../../lib/monitor/monitor.utils';
import { AddressType, type MonitorAddress, type MonitorDomain } from '../../lib/monitor/types';
import type { BreachesGetResponse, MaybeNull } from '../../types';
import { or } from '../../utils/fp/predicates';
import { partialMerge } from '../../utils/object/merge';
import {
    addCustomAddress,
    deleteCustomAddress,
    getBreaches,
    matchSyncAction,
    resolveAddressMonitor,
    setBreaches,
    toggleAddressMonitor,
    verifyCustomAddress,
} from '../actions';

export type MonitorState = MaybeNull<{
    custom: MonitorAddress<AddressType.CUSTOM>[];
    preview: MonitorDomain[];
    proton: MonitorAddress<AddressType.PROTON>[];
    customDomains: boolean;
    total: number;
}>;

const intoMonitorState = (breaches: BreachesGetResponse): MonitorState => ({
    custom: breaches.CustomEmails?.map(intoCustomMonitorAddress) ?? [],
    preview: breaches.DomainsPeek?.map(intoMonitorDomain) ?? [],
    proton: breaches.Addresses?.map(intoProtonMonitorAddress) ?? [],
    customDomains: breaches.HasCustomDomains,
    total: breaches.EmailsCount,
});

const monitorReducer: Reducer<MonitorState> = (state = null, action) => {
    if (matchSyncAction(action) && action.payload?.v === 2) return intoMonitorState(action.payload.breaches);
    if (or(getBreaches.success.match, setBreaches.match)(action)) return intoMonitorState(action.payload);

    if (state) {
        if (addCustomAddress.success.match(action)) {
            return partialMerge(state, {
                custom: state.custom.concat(intoCustomMonitorAddress(action.payload)),
            });
        }

        if (verifyCustomAddress.success.match(action)) {
            const breached = (action.payload.breachCount ?? 0) > 0;

            return partialMerge(state, {
                total: state.total + Number(breached),
                custom: state.custom.map((breach) => {
                    if (breach.addressId !== action.payload.addressId) return breach;
                    return action.payload;
                }),
            });
        }

        if (verifyCustomAddress.failure.match(action)) {
            const addressId = lastItem(action.meta.request.id.split('::'));
            if (action.error.code === PassErrorCode.NOT_ALLOWED && addressId) {
                return partialMerge(state, { custom: state.custom.filter((breach) => breach.addressId !== addressId) });
            }
        }

        if (deleteCustomAddress.success.match(action)) {
            const breach = state.custom.find((breach) => breach.addressId === action.payload);
            const breached = (breach?.breachCount ?? 0) > 0;

            return partialMerge(state, {
                total: Math.max(0, state.total - Number(breached)),
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
                    const breached = (address?.breachCount ?? 0) > 0;

                    return address
                        ? partialMerge(state, {
                              total: Math.max(0, state.total - Number(breached)),
                              custom: state.custom.map((breach) => {
                                  if (breach.addressId !== dto.addressId) return breach;
                                  return { ...breach, breachCount: 0, breached: false };
                              }),
                          })
                        : state;
                }

                case AddressType.PROTON: {
                    const address = state.proton.find(({ addressId }) => addressId === dto.addressId);
                    const breached = (address?.breachCount ?? 0) > 0;

                    return address
                        ? partialMerge(state, {
                              total: Math.max(0, state.total - Number(breached)),
                              proton: state.proton.map((breach) => {
                                  if (breach.addressId !== dto.addressId) return breach;
                                  return { ...breach, breachCount: 0, breached: false };
                              }),
                          })
                        : state;
                }
            }
        }

        if (toggleAddressMonitor.success.match(action)) {
            const type = action.payload.type;
            if (type === AddressType.ALIAS) return state;

            return partialMerge(state, {
                [type]: state[type].map((breach) =>
                    action.payload.type === AddressType.ALIAS || breach.addressId !== action.payload.addressId ? breach : action.payload
                ),
            });
        }
    }

    return state;
};

export default monitorReducer;
