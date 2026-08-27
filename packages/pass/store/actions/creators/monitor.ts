import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { FetchedBreaches } from '@proton/components/containers/credentialLeak/models';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PROTON_SENTINEL_NAME, type SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/constants';
import identity from '@proton/utils/identity';

import { isMonitored } from '../../../lib/items/item.predicates';
import { getAddressId } from '../../../lib/monitor/monitor.utils';
import type {
    AddressBreachDTO,
    AddressType,
    CompromisedPasswordEntry,
    CustomAddressID,
    MonitorAddress,
    MonitorToggleDTO,
    MonitorVerifyDTO,
    ProtonAddressID,
} from '../../../lib/monitor/types';
import type { ItemRevision, SelectedItem, ShareId, TabId, UniqueItem } from '../../../types';
import type { BreachCustomEmailGetResponse, BreachesGetResponse, UpdateUserMonitorStateRequest } from '../../../types/api/pass';
import { prop } from '../../../utils/fp/lens';
import { pipe } from '../../../utils/fp/pipe';
import { UNIX_MINUTE } from '../../../utils/time/constants';
import { dataRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';
import { withCache } from '../enhancers/cache';
import { withNotification } from '../enhancers/notification';
import { selectedItemKey } from '../requests';

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

export const setBreaches = createAction<BreachesGetResponse>('monitor::breaches::set');
export const getBreaches = requestActionsFactory<void, BreachesGetResponse>('monitor::breaches::get')({
    success: dataRequest(UNIX_MINUTE),
});

export const getProtonBreach = requestActionsFactory<ProtonAddressID, FetchedBreaches[]>('monitor::breaches::proton::get')({
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

export const getCustomBreach = requestActionsFactory<CustomAddressID, FetchedBreaches[]>('monitor::breaches::custom::get')({
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

export const addCustomAddress = requestActionsFactory<string, BreachCustomEmailGetResponse>('monitor::breaches::custom::add')({
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

export const deleteCustomAddress = requestActionsFactory<CustomAddressID, CustomAddressID>('monitor::breaches::custom::delete')({
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

export const toggleAddressMonitor = requestActionsFactory<MonitorToggleDTO, MonitorAddress>('monitor::breaches::address::toggle')({
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

export const resolveAddressMonitor = requestActionsFactory<AddressBreachDTO, AddressBreachDTO>('monitor::breaches::address::resolve')({
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

export const setItemFlags = requestActionsFactory<SelectedItem & { SkipHealthCheck: boolean }, SelectedItem & { item: ItemRevision }>(
    'monitor::toggle::item'
)({
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

export const compromisedPasswordsSync = createAction(
    'monitor::compromised-passwords::sync',
    (payload: { lastSyncedChange: number; results: { item: UniqueItem; entry: CompromisedPasswordEntry }[] }) => withCache({ payload })
);

export const compromisedPasswordUpdate = createAction(
    'monitor::compromised-password::update',
    (payload: { item: UniqueItem; entry: CompromisedPasswordEntry }) => withCache({ payload })
);

export const compromisedPasswordsBatchUpdate = createAction(
    'monitor::compromised-passwords::batch-update',
    (payload: { item: UniqueItem; entry: CompromisedPasswordEntry }[]) => withCache({ payload })
);

export const compromisedPasswordsProgress = createAction(
    'monitor::compromised-passwords::progress',
    (payload: { completed: number; total: number }) => ({ payload })
);

export type CompromisedPasswordsCheckDTO = { shareIds?: ShareId[]; tabId?: TabId; generation: number };
export const checkCompromisedPasswords = requestActionsFactory<CompromisedPasswordsCheckDTO, UniqueItem[]>(
    'monitor::compromised-passwords::check'
)({
    key: ({ tabId, generation }) => `${tabId ?? 0}::${generation}`,
});

export const resendVerificationCode = requestActionsFactory<CustomAddressID, boolean>('monitor::breaches::custom::resend::verification')({
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
