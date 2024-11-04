import {
    createMailboxApi,
    deleteMailboxApi,
    getMailboxesApi,
    resendVerifyMailboxApi,
    setDefaultMailboxApi,
    validateMailboxApi,
} from '@proton/pass/lib/alias/alias.requests';
import {
    createMailbox,
    deleteMailbox,
    getMailboxes,
    resendVerifyMailbox,
    setDefaultMailbox,
    validateMailbox,
} from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

const getMailboxesSaga = createRequestSaga({
    actions: getMailboxes,
    call: getMailboxesApi,
});

const createMailboxSaga = createRequestSaga({
    actions: createMailbox,
    call: createMailboxApi,
});

const resendVerifyMailboxSaga = createRequestSaga({
    actions: resendVerifyMailbox,
    call: resendVerifyMailboxApi,
});

const validateMailboxSaga = createRequestSaga({
    actions: validateMailbox,
    call: validateMailboxApi,
});

const deleteMailboxSaga = createRequestSaga({
    actions: deleteMailbox,
    call: deleteMailboxApi,
});

const setDefaultMailboxSaga = createRequestSaga({
    actions: setDefaultMailbox,
    call: setDefaultMailboxApi,
});

export default [
    getMailboxesSaga,
    createMailboxSaga,
    resendVerifyMailboxSaga,
    validateMailboxSaga,
    deleteMailboxSaga,
    setDefaultMailboxSaga,
];
