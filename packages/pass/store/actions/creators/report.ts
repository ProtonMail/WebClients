import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { BugPayload } from '@proton/shared/lib/api/reports';

import type { ClientEndpoint } from '../../../types';
import { uniqueId } from '../../../utils/string/unique-id';
import { withRequest, withRequestFailure, withRequestSuccess } from '../../request/enhancers';
import { withNotification } from '../enhancers/notification';
import { reportBugRequest } from '../requests';

export const reportBugIntent = createAction('report::bug::intent', (payload: BugPayload) =>
    withRequest({ status: 'start', id: reportBugRequest(uniqueId()) })({ payload })
);

export const reportBugSuccess = createAction(
    'report::bug::success',
    withRequestSuccess((endpoint?: ClientEndpoint) =>
        withNotification({
            type: 'success',
            text: c('Info').t`Thank you, the problem has been reported`,
            endpoint,
        })({ payload: {} })
    )
);

export const reportBugFailure = createAction(
    'report::bug::failure',
    withRequestFailure((error: unknown, endpoint?: ClientEndpoint) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Error reporting problem`,
            error,
            endpoint,
        })({ payload: {}, error })
    )
);
