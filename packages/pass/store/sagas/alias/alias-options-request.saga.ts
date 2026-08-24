import { select } from 'redux-saga/effects';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { UserType } from '@proton/shared/lib/interfaces';

import { getAliasOptions } from '../../../lib/alias/alias.requests';
import { PassErrorCode, UnverifiedUserError } from '../../../lib/api/errors';
import type { AliasOptions, Maybe } from '../../../types';
import { requestAliasOptions } from '../../actions';
import { createRequestSaga } from '../../request/sagas';
import { selectUserType } from '../../selectors';

export default createRequestSaga({
    actions: requestAliasOptions,
    call: function* (shareId) {
        try {
            const options: AliasOptions = yield getAliasOptions(shareId);
            return options;
        } catch (err) {
            const error = getApiError(err);
            const userType: Maybe<UserType> = yield select(selectUserType);
            const protonUser = userType && userType === UserType.PROTON;

            /** Special case for `2011` errors for external and managed
             * user accounts. This can only happen if the user primary
             * email is not verified */
            if (error.code === PassErrorCode.NOT_ALLOWED && !protonUser) {
                throw new UnverifiedUserError(error.message);
            }

            throw err;
        }
    },
});
