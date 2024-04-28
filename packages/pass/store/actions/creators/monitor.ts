import { c } from 'ttag';

import type { FetchedBreaches } from '@proton/components/containers';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';
import type {
    AddressType,
    CustomAddressID,
    MonitorAddress,
    MonitorToggleDTO,
    MonitorVerifyDTO,
    ProtonAddressID,
} from '@proton/pass/lib/monitor/types';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    addCustomAddressRequest,
    aliasBreachRequest,
    aliasResolveRequest,
    breachesRequest,
    customBreachRequest,
    customResolveRequest,
    deleteCustomAddressRequest,
    itemUpdateFlagsRequest,
    monitorToggleRequest,
    protonBreachRequest,
    protonResolveRequest,
    resendCustomAddressCodeRequest,
    sentinelToggleRequest,
    toggleCustomAddressRequest,
    verifyCustomAddressRequest,
} from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ItemRevision, SelectedItem } from '@proton/pass/types';
import type {
    BreachCustomEmailGetResponse,
    BreachesGetResponse,
    UpdateUserMonitorStateRequest,
} from '@proton/pass/types/api/pass';
import { pipe } from '@proton/pass/utils/fp/pipe';
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

export const monitorToggle = requestActionsFactory<UpdateUserMonitorStateRequest, UpdateUserMonitorStateRequest>(
    'monitor::all:addresses:toggle'
)({
    requestId: monitorToggleRequest,
    success: {
        prepare: ({ ProtonAddress, Aliases }) =>
            pipe(
                withCache,
                withNotification({
                    type: 'info',
                    text: c('Info').t`Monitoring settings successfully updated`,
                })
            )({ payload: { ProtonAddress, Aliases } }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to update monitoring settings`,
                error,
            })({ payload: {} }),
    },
});

export const getBreaches = requestActionsFactory<void, BreachesGetResponse>('monitor::breaches::get')({
    requestId: breachesRequest,
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
    requestId: addCustomAddressRequest,
    success: { config: { data: true } },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to add email address`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const deleteCustomAddress = requestActionsFactory<CustomAddressID, CustomAddressID>(
    'monitor::breaches::custom::delete'
)({
    requestId: deleteCustomAddressRequest,
    success: {
        prepare: (addressId) =>
            withNotification({
                text: c('Info').t`Email address successfully deleted from monitoring`,
                type: 'info',
            })({ payload: addressId }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to delete email address from monitoring`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const verifyCustomAddress = requestActionsFactory<MonitorVerifyDTO, CustomAddressID>(
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

export const toggleCustomAddress = requestActionsFactory<MonitorToggleDTO, MonitorAddress<AddressType.CUSTOM>>(
    'monitor::breaches::custom::toggle'
)({
    requestId: ({ addressId }) => toggleCustomAddressRequest(addressId),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: payload.monitored
                    ? c('Info').t`Email address successfully included in monitoring`
                    : c('Info').t`Email address successfully excluded from monitoring`,
            })({ payload }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed updating monitoring status for this email address`,
                error,
            })({ payload: {} }),
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
    'monitor::breaches::custom::resolve'
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

export const resendVerificationCode = requestActionsFactory<CustomAddressID, boolean>(
    'monitor::breaches::custom::resend::verification'
)({
    requestId: resendCustomAddressCodeRequest,
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to resend verification for custom email`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});
