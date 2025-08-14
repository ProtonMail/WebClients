import { createAction } from '@reduxjs/toolkit';

// meant for tests only
export const unloadReduxRequest = createAction('lumo/tests/unloadRedux');
export const reloadReduxRequest = createAction('lumo/tests/reloadRedux');
export const stopRootSaga = createAction('lumo/tests/stopRootSaga');
