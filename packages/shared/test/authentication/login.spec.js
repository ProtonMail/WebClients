import { reducer, DEFAULT_STATE, ACTION_TYPES, FORM } from '../../lib/authentication/loginReducer';

import {
    handleLoginAction,
    handleAuthAction,
    handleDeprecationAction,
    handleFinalizeAction,
    handleUnlockAction
} from '../../lib/authentication/loginActions';

import {
    INFO_RESPONSE,
    AUTH_RESPONSE,
    AUTH_RESPONSE_CLEARTEXT,
    USER_RESPONSE,
    SALT_RESPONSE,
    COOKIE_RESPONSE,
    USER_RESPONSE_NO_KEYS,
    INFO_RESPONSE_NO_2FA,
    AUTH_RESPONSE_NO_UNLOCK
} from './login.data';

const mockApi = (responses) => {
    let i = 0;
    const cb = async () => {
        const response = responses[i++];
        if (response instanceof Error) {
            throw response;
        }
        return response;
    };
    return jasmine.createSpy('mockApi').and.callFake(cb);
};

const ACTIONS = {
    [ACTION_TYPES.SUBMIT_LOGIN_EFFECT]: handleLoginAction,
    [ACTION_TYPES.SUBMIT_AUTH_EFFECT]: handleAuthAction,
    [ACTION_TYPES.SUBMIT_UNLOCK_EFFECT]: handleUnlockAction,
    [ACTION_TYPES.PREPARE_DEPRECATION_EFFECT]: handleDeprecationAction,
    [ACTION_TYPES.FINALIZE_EFFECT]: handleFinalizeAction
};

describe('login', () => {
    const runTest = async (actions, assertions, ctx) => {
        let state = DEFAULT_STATE;
        assertions.reverse();

        for (let i = 0; i < actions.length; ++i) {
            const staticAction = actions[i];

            state = reducer(state, staticAction);

            assertions.pop()(state);

            while (state.action) {
                const action = await ACTIONS[state.action](state, ctx);
                if (action.type === ACTION_TYPES.DONE) {
                    return state;
                }
                state = reducer(state, action);
                assertions.pop()(state);
            }
        }

        return state;
    };

    it('should login a user', async () => {
        const userActions = [
            {
                type: ACTION_TYPES.SUBMIT_LOGIN,
                payload: {
                    username: 'test',
                    password: '123'
                }
            }
        ];

        const assertions = [
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                expect(form).toEqual(FORM.LOGIN);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                expect(form).toEqual(FORM.LOGIN);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_UNLOCK_EFFECT);
                expect(form).toEqual(FORM.LOGIN);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.FINALIZE_EFFECT);
                expect(form).toEqual(FORM.LOGIN);
            }
        ];

        const apiReturns = [INFO_RESPONSE_NO_2FA, AUTH_RESPONSE_NO_UNLOCK, COOKIE_RESPONSE];

        const api = mockApi(apiReturns);
        const state = await runTest(userActions, assertions, { api });
        expect(state).toEqual(
            jasmine.objectContaining({
                action: ACTION_TYPES.FINALIZE_EFFECT,
                form: FORM.LOGIN,
                authVersion: 4,
                primaryKey: {
                    PrivateKey: AUTH_RESPONSE_NO_UNLOCK.PrivateKey,
                    KeySalt: AUTH_RESPONSE_NO_UNLOCK.KeySalt
                },
                credentials: {
                    username: 'test',
                    password: '123',
                    mailboxPassword: '123',
                    keyPassword: 'be4p.vIng2.sjsUf5AXRe7qJAXnzDvW'
                }
            })
        );
        expect(api.calls.all().length).toEqual(apiReturns.length);
    });

    it('should login a user with totp in 2-password mode', async () => {
        const userActions = [
            {
                type: ACTION_TYPES.SUBMIT_LOGIN,
                payload: {
                    username: 'test',
                    password: '123'
                }
            },
            {
                type: ACTION_TYPES.SUBMIT_TOTP,
                payload: '123123'
            },
            {
                type: ACTION_TYPES.SUBMIT_UNLOCK,
                payload: '1234'
            }
        ];

        const assertions = [
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                expect(form).toEqual(FORM.LOGIN);
            },
            ({ action, form }) => {
                expect(action).toEqual(undefined);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(undefined);
                expect(form).toEqual(FORM.UNLOCK);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_UNLOCK_EFFECT);
                expect(form).toEqual(FORM.UNLOCK);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.FINALIZE_EFFECT);
                expect(form).toEqual(FORM.UNLOCK);
            }
        ];

        const apiReturns = [INFO_RESPONSE, AUTH_RESPONSE, COOKIE_RESPONSE];

        const api = mockApi(apiReturns);
        const state = await runTest(userActions, assertions, { api }).catch((e) => console.error(e));

        expect(state).toEqual(
            jasmine.objectContaining({
                action: ACTION_TYPES.FINALIZE_EFFECT,
                form: FORM.UNLOCK,
                authVersion: 4,
                primaryKey: {
                    PrivateKey: AUTH_RESPONSE.PrivateKey,
                    KeySalt: AUTH_RESPONSE.KeySalt
                },
                credentials: {
                    username: 'test',
                    password: '123',
                    totp: '123123',
                    mailboxPassword: '1234',
                    keyPassword: '/TVusgXVQZjOHBQsAPSOAxusX9gVFmm'
                }
            })
        );
        expect(api.calls.all().length).toEqual(apiReturns.length);
    });

    it('should login a user with clear text access token', async () => {
        const userActions = [
            {
                type: ACTION_TYPES.SUBMIT_LOGIN,
                payload: {
                    username: 'test',
                    password: '123'
                }
            },
            {
                type: ACTION_TYPES.SUBMIT_TOTP,
                payload: '123123'
            },
            {
                type: ACTION_TYPES.SUBMIT_UNLOCK,
                payload: '1234'
            }
        ];

        const assertions = [
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                expect(form).toEqual(FORM.LOGIN);
            },
            ({ action, form }) => {
                expect(action).toEqual(undefined);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.PREPARE_DEPRECATION_EFFECT);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(undefined);
                expect(form).toEqual(FORM.UNLOCK);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_UNLOCK_EFFECT);
                expect(form).toEqual(FORM.UNLOCK);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.FINALIZE_EFFECT);
                expect(form).toEqual(FORM.UNLOCK);
            }
        ];

        const apiReturns = [INFO_RESPONSE, AUTH_RESPONSE_CLEARTEXT, COOKIE_RESPONSE, USER_RESPONSE, SALT_RESPONSE];

        const api = mockApi(apiReturns);
        const state = await runTest(userActions, assertions, { api });

        expect(state).toEqual(
            jasmine.objectContaining({
                action: ACTION_TYPES.FINALIZE_EFFECT,
                form: FORM.UNLOCK,
                authVersion: 4,
                userResult: USER_RESPONSE.User,
                primaryKey: {
                    PrivateKey: USER_RESPONSE.User.Keys[0].PrivateKey,
                    KeySalt: SALT_RESPONSE.KeySalts[0].KeySalt
                },
                credentials: {
                    username: 'test',
                    password: '123',
                    totp: '123123',
                    mailboxPassword: '1234',
                    keyPassword: 'pOvzDc/vsX1yWizwAO1JkpOBpOHz6Qi'
                }
            })
        );
    });

    it('should login a user without any keys in clear text access token', async () => {
        const userActions = [
            {
                type: ACTION_TYPES.SUBMIT_LOGIN,
                payload: {
                    username: 'test',
                    password: '123'
                }
            },
            {
                type: ACTION_TYPES.SUBMIT_TOTP,
                payload: '123123'
            }
        ];

        const assertions = [
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                expect(form).toEqual(FORM.LOGIN);
            },
            ({ action, form }) => {
                expect(action).toEqual(undefined);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.PREPARE_DEPRECATION_EFFECT);
                expect(form).toEqual(FORM.TOTP);
            },
            ({ action, form }) => {
                expect(action).toEqual(ACTION_TYPES.FINALIZE_EFFECT);
                expect(form).toEqual(FORM.TOTP);
            }
        ];

        const apiReturns = [
            INFO_RESPONSE,
            AUTH_RESPONSE_CLEARTEXT,
            COOKIE_RESPONSE,
            USER_RESPONSE_NO_KEYS,
            SALT_RESPONSE
        ];

        const api = mockApi(apiReturns);
        const state = await runTest(userActions, assertions, { api });

        expect(state).toEqual(
            jasmine.objectContaining({
                action: ACTION_TYPES.FINALIZE_EFFECT,
                form: FORM.TOTP,
                authVersion: 4,
                userResult: USER_RESPONSE_NO_KEYS.User,
                credentials: {
                    username: 'test',
                    password: '123',
                    totp: '123123'
                }
            })
        );
    });
});
