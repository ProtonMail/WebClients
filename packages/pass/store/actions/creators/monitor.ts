import { c } from 'ttag';

import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { sentinelToggleRequest } from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
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
