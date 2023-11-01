import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import { type ExtensionEndpoint } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { type BugPayload } from '@proton/shared/lib/api/reports';

import { reportBugRequest } from '../requests';
import withCacheBlock from '../with-cache-block';

export const reportBugIntent = createAction('report::bug::intent', (payload: BugPayload) =>
    pipe(withRequest({ type: 'start', id: reportBugRequest(uniqueId()) }), withCacheBlock)({ payload })
);

export const reportBugSuccess = createAction(
    'report::bug::success',
    withRequestSuccess((endpoint?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'success',
                text: c('Info').t`Thank you, the problem has been reported`,
                endpoint,
            })
        )({ payload: {} })
    )
);

export const reportBugFailure = createAction(
    'report::bug::failure',
    withRequestFailure((error: unknown, endpoint?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Error reporting problem`,
                error,
                endpoint,
            })
        )({ payload: {}, error })
    )
);
