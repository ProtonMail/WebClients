import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type ExtensionEndpoint } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import { type BugPayload } from '@proton/shared/lib/api/reports';

import { reportProblem } from '../requests';
import withNotification from '../with-notification';
import withRequest from '../with-request';

export const reportProblemIntent = createAction('report problem intent', (payload: BugPayload) =>
    withRequest({
        type: 'start',
        id: reportProblem(),
    })({ payload })
);

export const reportProblemSuccess = createAction(
    'report problem success',
    (payload: BugPayload, target?: ExtensionEndpoint) =>
        pipe(
            withRequest({
                type: 'success',
                id: reportProblem(),
            }),
            withNotification({
                type: 'success',
                text: c('Info').t`Thank you, the problem has been reported`,
                target,
            })
        )({ payload })
);

export const reportProblemError = createAction(
    'report problem error',
    (payload: BugPayload, error: unknown, target?: ExtensionEndpoint) =>
        pipe(
            withRequest({
                type: 'failure',
                id: reportProblem(),
            }),
            withNotification({
                type: 'error',
                text: c('Error').t`Error reporting problem`,
                error,
                target,
            })
        )({ payload })
);
