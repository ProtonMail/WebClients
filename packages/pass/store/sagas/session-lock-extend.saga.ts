import { takeLeading } from 'redux-saga/effects';

import { checkSessionLock } from '../../auth';
import { extendLock } from '../actions';

/* the check session lock endpoint will extend the lock if registered.
 * It's safe to ping this route on activity probing as it doesn't make
 * any database operations */
export default function* watcher() {
    yield takeLeading(extendLock.match, function* () {
        yield checkSessionLock();
    });
}
