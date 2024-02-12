import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/enhancers/request';
import { reportBugRequest } from '@proton/pass/store/actions/requests';
import { type ClientEndpoint } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { type BugPayload } from '@proton/shared/lib/api/reports';

export const reportBugIntent = createAction('report::bug::intent', (payload: BugPayload) =>
    withRequest({ type: 'start', id: reportBugRequest(uniqueId()) })({ payload })
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
