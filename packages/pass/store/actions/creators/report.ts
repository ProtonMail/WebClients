import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { reportProblem } from '@proton/pass/store/actions/requests';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest from '@proton/pass/store/actions/with-request';
import { type ExtensionEndpoint } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import { type BugPayload } from '@proton/shared/lib/api/reports';

export const reportProblemIntent = createAction('report problem intent', (payload: BugPayload) =>
    withRequest({
        type: 'start',
        id: reportProblem,
    })({ payload })
);

export const reportProblemSuccess = createAction('report problem success', (receiver?: ExtensionEndpoint) =>
    pipe(
        withRequest({
            type: 'success',
            id: reportProblem,
        }),
        withNotification({
            type: 'success',
            text: c('Info').t`Thank you, the problem has been reported`,
            receiver,
        })
    )({ payload: {} })
);

export const reportProblemError = createAction('report problem error', (error: unknown, receiver?: ExtensionEndpoint) =>
    pipe(
        withRequest({
            type: 'failure',
            id: reportProblem,
        }),
        withNotification({
            type: 'error',
            text: c('Error').t`Error reporting problem`,
            error,
            receiver,
        })
    )({ payload: {} })
);
