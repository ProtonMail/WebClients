import {
    cancelMailboxEditApi,
    createMailboxApi,
    deleteMailboxApi,
    editMailboxApi,
    getMailboxesApi,
    resendVerifyMailboxApi,
    setDefaultMailboxApi,
    validateMailboxApi,
} from '@proton/pass/lib/alias/alias.requests';
import {
    cancelMailboxEdit,
    createMailbox,
    deleteMailbox,
    editMailbox,
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

const editMailboxSaga = createRequestSaga({
    actions: editMailbox,
    call: editMailboxApi,
});

const cancelMailboxEditSaga = createRequestSaga({
    actions: cancelMailboxEdit,
    call: cancelMailboxEditApi,
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
    editMailboxSaga,
    cancelMailboxEditSaga,
    setDefaultMailboxSaga,
];
