import { reducer, DEFAULT_STATE, FORM, ACTION_TYPES } from 'proton-shared/lib/authentication/loginReducer';
import {
    handleFinalizeAction,
    handleUnlockAction,
    handleDeprecationAction,
    handleAuthAction,
    handleLoginAction
} from 'proton-shared/lib/authentication/loginActions';

/* @ngInject */
const loginContainer = (
    $state,
    eventManager,
    compatApi,
    tempStorage,
    AppModel,
    notification,
    translator,
    gettextCatalog,
    networkActivityTracker,
    authentication
) => {
    const FORM_MAP = {
        [FORM.LOGIN]: 'LOGIN',
        [FORM.TOTP]: 'TOTP',
        [FORM.UNLOCK]: 'UNLOCK'
    };

    const ACTION_MAP = {
        [ACTION_TYPES.SUBMIT_LOGIN_EFFECT]: handleLoginAction,
        [ACTION_TYPES.SUBMIT_AUTH_EFFECT]: handleAuthAction,
        [ACTION_TYPES.PREPARE_DEPRECATION_EFFECT]: handleDeprecationAction,
        [ACTION_TYPES.SUBMIT_UNLOCK_EFFECT]: handleUnlockAction,
        [ACTION_TYPES.FINALIZE_EFFECT]: handleFinalizeAction
    };

    const I18N = translator(() => ({
        PASSWORD_ERROR: gettextCatalog.getString('Incorrect decryption password', null, 'Error')
    }));

    const track = networkActivityTracker.track;

    const handleLogin = (state = {}) => {
        const {
            authResult: { UID, EventID },
            credentials: { keyPassword, mailboxPassword },
            userResult
        } = state;

        tempStorage.setItem('plainMailboxPass', mailboxPassword);
        tempStorage.setItem('userResult', userResult);

        authentication.setUID(UID);
        authentication.setPassword(keyPassword);

        eventManager.initialize(EventID);

        $state.go('secured.inbox');
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/views/login.tpl.html'),
        link(scope) {
            let destroyed = false;

            const setBodyUnlock = (value) => {
                AppModel.set('isUnlock', value);
            };

            const show = (type, loading) => {
                scope.$applyAsync(() => {
                    scope.loading = !!loading;
                    scope.show = type;
                    setBodyUnlock(type === 'UNLOCK' || type === 'DECRYPTING');
                });
            };

            const update = (oldState, newState) => {
                if (newState.action) {
                    const promise = ACTION_MAP[newState.action](newState, { api: compatApi }).then((result) => {
                        dispatch(result); // eslint-disable-line
                    });
                    track(promise);
                }

                // Other errors are shown from the API listener.
                if (newState.error && newState.error.name === 'PasswordError') {
                    notification.error(I18N.PASSWORD_ERROR);
                }

                show(FORM_MAP[newState.form], !!newState.action);
            };

            let state = DEFAULT_STATE;

            const dispatch = (action) => {
                if (destroyed) {
                    return;
                }
                const oldState = state;
                if (action.type === ACTION_TYPES.DONE) {
                    show('DECRYPTING', true);
                    handleLogin(oldState);
                    return;
                }
                state = reducer(oldState, action);
                update(oldState, state);
            };

            scope.show = 'LOGIN';
            scope.username = '';

            scope.onSubmitLogin = async ({ username, password }) => {
                // Remember username if login fails.
                scope.username = username;
                dispatch({ type: ACTION_TYPES.SUBMIT_LOGIN, payload: { username, password } });
            };

            scope.onSubmitTotp = async ({ totp }) => {
                dispatch({ type: ACTION_TYPES.SUBMIT_TOTP, payload: totp });
            };

            scope.onSubmitUnlock = async ({ password }) => {
                dispatch({ type: ACTION_TYPES.SUBMIT_UNLOCK, payload: password });
            };

            scope.$on('$destroy', () => {
                setBodyUnlock(false);
                state = DEFAULT_STATE;
                destroyed = true;
            });
        }
    };
};

export default loginContainer;
