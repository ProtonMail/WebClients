import { c } from 'ttag';

import type { FetchedBreaches } from '@proton/components/containers';
import type { AddressVerify, CustomAddressID, ProtonAddressID } from '@proton/pass/lib/monitor/types';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    aliasBreachRequest,
    breachesRequest,
    customBreachRequest,
    monitorCustomAddressRequest,
    protonBreachRequest,
    sentinelToggleRequest,
    verifyCustomAddressRequest,
} from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { SelectedItem } from '@proton/pass/types';
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
    success: { config: { maxAge: 5 * UNIX_MINUTE, data: true } },
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

export const monitorCustomAddress = requestActionsFactory<string, BreachCustomEmailGetResponse>(
    'monitor::breaches::custom::add'
)({
    requestId: monitorCustomAddressRequest,
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

export const verifyCustomAddress = requestActionsFactory<AddressVerify, boolean>('monitor::breaches::custom::verify')({
    requestId: ({ emailId }) => verifyCustomAddressRequest(emailId),
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to verify email address`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});
