import { select } from 'redux-saga/effects';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { UserType } from '@proton/shared/lib/interfaces/User';

import { getAliasOptions } from '../../../lib/alias/alias.requests';
import { PassErrorCode, UnverifiedUserError } from '../../../lib/api/errors';
import type { AliasOptions } from '../../../types/data/alias';
import type { Maybe } from '../../../types/utils';
import { requestAliasOptions } from '../../actions/creators/alias';
import { createRequestSaga } from '../../request/sagas';
import { selectUserType } from '../../selectors/user';

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
