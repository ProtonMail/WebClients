import { describe, it } from 'mocha';
import assert from 'assert';
import requireInject from 'require-inject';
import { getAuthVersionWithFallback } from 'pm-srp';
import { reducer, DEFAULT_STATE, ACTION_TYPES, FORM } from '../../lib/authentication/loginReducer';

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
import { createSpy } from '../spy';

const mockSrp = {
    getAuthVersionWithFallback,
    getSrp: () => ({
        expectedServerProof: 'server-proof'
    }),
    computeKeyPassword: () => 'key-pw',
    AUTH_VERSION: 4
};

const mockPmcrypto = {
    decryptPrivateKey: async () => '',
    getMessage: () => '',
    decryptMessage: () => '',
    keyInfo: () => ''
};

const mocks = {
    'pm-srp': mockSrp,
    pmcrypto: mockPmcrypto
};

const {
    handleLoginAction,
    handleAuthAction,
    handleDeprecationAction,
    handleFinalizeAction,
    handleUnlockAction
} = requireInject.withEmptyCache('../../lib/authentication/loginActions', mocks);

const mockApi = (responses) => {
    let i = 0;
    return createSpy(async () => {
        const response = responses[i++];
        if (response instanceof Error) {
            throw response;
        }
        return response;
    });
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
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                assert.strictEqual(state.form, FORM.LOGIN);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                assert.strictEqual(state.form, FORM.LOGIN);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_UNLOCK_EFFECT);
                assert.strictEqual(state.form, FORM.LOGIN);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
                assert.strictEqual(state.form, FORM.LOGIN);
            }
        ];

        const apiReturns = [INFO_RESPONSE_NO_2FA, AUTH_RESPONSE_NO_UNLOCK, COOKIE_RESPONSE];

        const api = mockApi(apiReturns);
        const state = await runTest(userActions, assertions, { api });

        assert.strictEqual(api.calls.length, apiReturns.length);
        assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
        assert.strictEqual(state.form, FORM.LOGIN);
        assert.strictEqual(state.userResult, undefined);
        assert.strictEqual(state.authVersion, 4);
        assert.strictEqual(state.primaryKey.PrivateKey, AUTH_RESPONSE.PrivateKey);
        assert.strictEqual(state.primaryKey.KeySalt, AUTH_RESPONSE.KeySalt);
        assert.strictEqual(state.credentials.keyPassword, 'key-pw');
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
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                assert.strictEqual(state.form, FORM.LOGIN);
            },
            (state) => {
                assert.strictEqual(state.action, undefined);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, undefined);
                assert.strictEqual(state.form, FORM.UNLOCK);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_UNLOCK_EFFECT);
                assert.strictEqual(state.form, FORM.UNLOCK);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
                assert.strictEqual(state.form, FORM.UNLOCK);
            }
        ];

        const apiReturns = [INFO_RESPONSE, AUTH_RESPONSE, COOKIE_RESPONSE];

        const api = mockApi(apiReturns);
        const state = await runTest(userActions, assertions, { api });

        assert.strictEqual(api.calls.length, apiReturns.length);
        assert.strictEqual(api.calls.length, 3);
        assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
        assert.strictEqual(state.form, FORM.UNLOCK);
        assert.strictEqual(state.userResult, undefined);
        assert.strictEqual(state.authVersion, 4);
        assert.strictEqual(state.primaryKey.PrivateKey, AUTH_RESPONSE.PrivateKey);
        assert.strictEqual(state.primaryKey.KeySalt, AUTH_RESPONSE.KeySalt);
        assert.strictEqual(state.credentials.keyPassword, 'key-pw');
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
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                assert.strictEqual(state.form, FORM.LOGIN);
            },
            (state) => {
                assert.strictEqual(state.action, undefined);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.PREPARE_DEPRECATION_EFFECT);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, undefined);
                assert.strictEqual(state.form, FORM.UNLOCK);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_UNLOCK_EFFECT);
                assert.strictEqual(state.form, FORM.UNLOCK);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
                assert.strictEqual(state.form, FORM.UNLOCK);
            }
        ];

        const apiReturns = [INFO_RESPONSE, AUTH_RESPONSE_CLEARTEXT, COOKIE_RESPONSE, USER_RESPONSE, SALT_RESPONSE];

        const api = mockApi(apiReturns);
        const state = await runTest(userActions, assertions, { api });

        assert.strictEqual(api.calls.length, apiReturns.length);
        assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
        assert.strictEqual(state.form, FORM.UNLOCK);
        assert.strictEqual(state.userResult, USER_RESPONSE.User);
        assert.strictEqual(state.authVersion, 4);
        assert.strictEqual(state.primaryKey.PrivateKey, USER_RESPONSE.User.Keys[0].PrivateKey);
        assert.strictEqual(state.primaryKey.KeySalt, SALT_RESPONSE.KeySalts[0].KeySalt);
        assert.strictEqual(state.credentials.keyPassword, 'key-pw');
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
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_LOGIN_EFFECT);
                assert.strictEqual(state.form, FORM.LOGIN);
            },
            (state) => {
                assert.strictEqual(state.action, undefined);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.SUBMIT_AUTH_EFFECT);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.PREPARE_DEPRECATION_EFFECT);
                assert.strictEqual(state.form, FORM.TOTP);
            },
            (state) => {
                assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
                assert.strictEqual(state.form, FORM.TOTP);
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

        assert.strictEqual(api.calls.length, apiReturns.length);
        assert.strictEqual(state.action, ACTION_TYPES.FINALIZE_EFFECT);
        assert.strictEqual(state.form, FORM.TOTP);
        assert.strictEqual(state.userResult, USER_RESPONSE_NO_KEYS.User);
        assert.strictEqual(state.authVersion, 4);
        assert.strictEqual(state.primaryKey, undefined);
        assert.strictEqual(state.credentials.keyPassword, undefined);
    });
});
