import { c } from 'ttag';

import type { FetchedBreaches } from '@proton/components';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';
import { getAddressId } from '@proton/pass/lib/monitor/monitor.utils';
import type {
    AddressBreachDTO,
    AddressType,
    CustomAddressID,
    MonitorAddress,
    MonitorToggleDTO,
    MonitorVerifyDTO,
    ProtonAddressID,
} from '@proton/pass/lib/monitor/types';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { selectedItemKey } from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ItemRevision, SelectedItem } from '@proton/pass/types';
import type {
    BreachCustomEmailGetResponse,
    BreachesGetResponse,
    UpdateUserMonitorStateRequest,
} from '@proton/pass/types/api/pass';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import type { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';

export type SentinelState = SETTINGS_PROTON_SENTINEL_STATE;

export const sentinelToggle = requestActionsFactory<SentinelState, SentinelState>('monitor::sentinel::toggle')({
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
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed updating ${PROTON_SENTINEL_NAME} setting`,
                error,
            })({ payload }),
    },
});

export const monitorToggle = requestActionsFactory<UpdateUserMonitorStateRequest, UpdateUserMonitorStateRequest>(
    'monitor::all:addresses:toggle'
)({
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
    success: { config: { maxAge: UNIX_MINUTE } },
});

export const getProtonBreach = requestActionsFactory<ProtonAddressID, FetchedBreaches[]>(
    'monitor::breaches::proton::get'
)({
    key: identity,
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
    key: identity,
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
    key: selectedItemKey,
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
    key: identity,
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
    key: identity,
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

export const verifyCustomAddress = requestActionsFactory<MonitorVerifyDTO, MonitorAddress<AddressType.CUSTOM>>(
    'monitor::breaches::custom::verify'
)({
    key: prop('addressId'),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                text: c('Error').t`Failed to verify email address`,
                type: 'error',
                error,
            })({ error: getApiError(error), payload }),
    },
});

export const toggleAddressMonitor = requestActionsFactory<MonitorToggleDTO, MonitorAddress>(
    'monitor::breaches::address::toggle'
)({
    key: getAddressId,
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

export const resolveAddressMonitor = requestActionsFactory<AddressBreachDTO, AddressBreachDTO>(
    'monitor::breaches::address::resolve'
)({
    key: getAddressId,
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('Info').t`All breaches for this address were resolved`,
            })({ payload }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to resolve breaches for this address`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const setItemFlags = requestActionsFactory<
    SelectedItem & { SkipHealthCheck: boolean },
    SelectedItem & { item: ItemRevision }
>('monitor::toggle::item')({
    key: selectedItemKey,
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
    key: identity,
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to resend verification for custom email`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});
