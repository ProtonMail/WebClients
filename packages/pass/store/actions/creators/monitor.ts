import { c } from 'ttag';

import type { FetchedBreaches } from '@proton/components/containers';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';
import type { AddressVerify, CustomAddressID, ProtonAddressID } from '@proton/pass/lib/monitor/types';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    aliasBreachRequest,
    aliasResolveRequest,
    breachesRequest,
    customBreachRequest,
    customResolveRequest,
    itemUpdateFlagsRequest,
    monitorCustomAddressRequest,
    protonBreachRequest,
    protonResolveRequest,
    sentinelToggleRequest,
    verifyCustomAddressRequest,
} from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ItemRevision, SelectedItem } from '@proton/pass/types';
import type { BreachCustomEmailGetResponse, BreachesGetResponse } from '@proton/pass/types/api/pass';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import type { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';

export type SentinelState = SETTINGS_PROTON_SENTINEL_STATE;

export const sentinelToggle = requestActionsFactory<SentinelState, SentinelState>('monitor::sentinel::toggle')({
    requestId: sentinelToggleRequest,
    success: {
        prepare: (value) =>
            withNotification({
                type: 'info',
                text: value
                    ? c('Info').t`${PROTON_SENTINEL_NAME} successfully enabled`
                    : c('Info').t`${PROTON_SENTINEL_NAME} successfully disabled`,
            })({ payload: { value } }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed updating ${PROTON_SENTINEL_NAME} setting`,
                error,
            })({ payload: {} }),
    },
});

export const getBreaches = requestActionsFactory<void, BreachesGetResponse>('monitor::breaches::get')({
    requestId: breachesRequest,
    success: { config: { maxAge: 5 * UNIX_MINUTE } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to load breaches`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const getProtonBreach = requestActionsFactory<ProtonAddressID, FetchedBreaches[]>(
    'monitor::breaches::proton::get'
)({
    requestId: protonBreachRequest,
    success: { config: { data: true } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to load breaches for this address`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const getCustomBreach = requestActionsFactory<CustomAddressID, FetchedBreaches[]>(
    'monitor::breaches::custom::get'
)({
    requestId: customBreachRequest,
    success: { config: { data: true } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to load breaches for this address`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const getAliasBreach = requestActionsFactory<SelectedItem, FetchedBreaches[]>('monitor::breaches::alias::get')({
    requestId: ({ shareId, itemId }) => aliasBreachRequest(shareId, itemId),
    success: { config: { data: true } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to load breaches for this email alias`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const addCustomAddress = requestActionsFactory<string, BreachCustomEmailGetResponse>(
    'monitor::breaches::custom::add'
)({
    requestId: monitorCustomAddressRequest,
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to add email address`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const verifyCustomAddress = requestActionsFactory<AddressVerify, CustomAddressID>(
    'monitor::breaches::custom::verify'
)({
    requestId: ({ addressId }) => verifyCustomAddressRequest(addressId),
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to verify email address`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const resolveProtonBreach = requestActionsFactory<ProtonAddressID, ProtonAddressID>(
    'monitor::breaches::proton_address::resolve'
)({
    requestId: protonResolveRequest,
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to mark this address as resolved`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const resolveCustomBreach = requestActionsFactory<CustomAddressID, CustomAddressID>(
    'monitor::breaches::custom_address::resolve'
)({
    requestId: customResolveRequest,
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to mark this address as resolved`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const resolveAliasBreach = requestActionsFactory<SelectedItem, SelectedItem>(
    'monitor::breaches::alias_address::resolve'
)({
    requestId: ({ shareId, itemId }) => aliasResolveRequest(shareId, itemId),
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to mark this address as resolved`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const setItemFlags = requestActionsFactory<
    SelectedItem & { SkipHealthCheck: boolean },
    SelectedItem & { item: ItemRevision }
>('monitor::toggle::item')({
    requestId: ({ shareId, itemId }) => itemUpdateFlagsRequest(shareId, itemId),
    success: {
        prepare: ({ shareId, itemId, item }) =>
            withNotification({
                type: 'info',
                text: isMonitored(item)
                    ? c('Info').t`Item successfully included in monitoring`
                    : c('Info').t`Item successfully excluded from monitoring`,
            })({ payload: { shareId, itemId, item } }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed updating monitor flag of the item`,
                error,
            })({ payload: {} }),
    },
});
