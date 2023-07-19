import { useReducer, useRef, useState } from 'react';

import PropTypes from 'prop-types';

import { updateServerTime } from '@proton/crypto';
import configureApi from '@proton/shared/lib/api';
import {
    getApiError,
    getApiErrorMessage,
    getIsOfflineError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import withApiHandlers from '@proton/shared/lib/api/helpers/withApiHandlers';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import xhr from '@proton/shared/lib/fetch/fetch';
import { withLocaleHeaders } from '@proton/shared/lib/fetch/headers';
import { getDateHeader } from '@proton/shared/lib/fetch/helpers';
import { localeCode } from '@proton/shared/lib/i18n';

import { useModals, useNotifications } from '../../hooks';
import UnlockModal from '../login/UnlockModal';
import AuthModal from '../password/AuthModal';
import DelinquentModal from './DelinquentModal';
import ApiContext from './apiContext';
import ApiServerTimeContext from './apiServerTimeContext';
import ApiStatusContext, { defaultApiStatus } from './apiStatusContext';
import HumanVerificationModal from './humanVerification/HumanVerificationModal';

const getSilenced = ({ silence } = {}, code) => {
    if (Array.isArray(silence)) {
        return silence.includes(code);
    }
    return !!silence;
};

const reducer = (oldState, diff) => {
    const newState = {
        ...oldState,
        ...diff,
    };
    // To prevent rerenders
    if (Object.keys(newState).every((key) => oldState[key] === newState[key])) {
        return oldState;
    }
    return newState;
};

/** @type any */
const ApiProvider = ({ config, onLogout, children, UID, noErrorState }) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [apiStatus, setApiStatus] = useReducer(reducer, defaultApiStatus);
    const [apiServerTime, setApiServerTime] = useState(undefined);
    const apiRef = useRef();

    if (!apiRef.current) {
        const handleMissingScopes = ({ scopes: missingScopes = [], error, options }) => {
            if (missingScopes.includes('nondelinquent')) {
                return new Promise((resolve, reject) => {
                    createModal(
                        <DelinquentModal
                            onClose={() => {
                                error.cancel = true;
                                reject(error);
                            }}
                        />
                    );
                });
            }
            if (missingScopes.includes('locked')) {
                return new Promise((resolve, reject) => {
                    createModal(
                        <UnlockModal
                            onCancel={() => {
                                error.cancel = true;
                                reject(error);
                            }}
                            onSuccess={() => {
                                if (!apiRef.current) {
                                    reject(error);
                                    return;
                                }
                                return resolve(apiRef.current({ ...options, output: 'raw' }));
                            }}
                        />
                    );
                });
            }
            if (missingScopes.includes('password')) {
                return new Promise((resolve, reject) => {
                    createModal(
                        <AuthModal
                            config={options}
                            onCancel={() => {
                                error.cancel = true;
                                reject(error);
                            }}
                            onError={(apiError) => {
                                reject(apiError);
                            }}
                            onSuccess={(result) => resolve(result.response)}
                        />
                    );
                });
            }
            return Promise.reject(error);
        };

        const handleVerification = ({ token, methods, onVerify, title }, error) => {
            return new Promise((resolve, reject) => {
                createModal(
                    <HumanVerificationModal
                        title={title}
                        token={token}
                        methods={methods}
                        onVerify={onVerify}
                        onSuccess={resolve}
                        onError={reject}
                        onClose={() => {
                            error.cancel = true;
                            reject(error);
                        }}
                    />
                );
            });
        };

        const call = configureApi({
            ...config,
            clientID: getClientID(config.APP_NAME),
            xhr,
            UID,
        });

        const callWithApiHandlers = withApiHandlers({
            call,
            UID,
            onMissingScopes: handleMissingScopes,
            onVerification: handleVerification,
        });

        apiRef.current = ({ output = 'json', ...rest }) => {
            // Only need to send locale headers in public app
            const config = UID ? rest : withLocaleHeaders(localeCode, rest);
            return callWithApiHandlers(config)
                .then((response) => {
                    const serverTime = getDateHeader(response.headers);
                    if (!serverTime) {
                        // The HTTP Date header is mandatory, so this should never occur.
                        // We need the server time for proper time sync:
                        // falling back to the local time can result in e.g. unverifiable signatures
                        throw new Error('Could not fetch server time');
                    }
                    setApiServerTime(updateServerTime(serverTime));
                    setApiStatus(defaultApiStatus);

                    if (output === 'stream') {
                        return response.body;
                    }
                    if (output === 'raw') {
                        return response;
                    }
                    return response[output]();
                })
                .catch((e) => {
                    const serverTime = e.response?.headers ? getDateHeader(e.response.headers) : undefined;
                    if (serverTime) {
                        setApiServerTime(updateServerTime(serverTime));
                    }

                    const { code } = getApiError(e);
                    const errorMessage = getApiErrorMessage(e);

                    const handleErrorNotification = () => {
                        if (errorMessage) {
                            const isSilenced = getSilenced(e.config, code);
                            if (!isSilenced) {
                                const codeExpirations = {
                                    [API_CUSTOM_ERROR_CODES.USER_RESTRICTED_STATE]: 10_000,
                                };
                                createNotification({
                                    type: 'error',
                                    text: errorMessage,
                                    ...(code in codeExpirations
                                        ? {
                                              id: code,
                                              expiration: codeExpirations[code],
                                          }
                                        : {
                                              expiration: config?.notificationExpiration,
                                          }
                                    ),
                                });
                            }
                        }
                    };

                    // Intended for the verify app where we always want to pass an error notification
                    if (noErrorState) {
                        handleErrorNotification();
                        throw e;
                    }

                    const isOffline = getIsOfflineError(e);
                    const isUnreachable = getIsUnreachableError(e);

                    if (isOffline || isUnreachable) {
                        setApiStatus({
                            apiUnreachable: isUnreachable ? errorMessage : '',
                            offline: isOffline,
                        });
                        throw e;
                    }
                    setApiStatus({
                        apiUnreachable: defaultApiStatus.apiUnreachable,
                        offline: defaultApiStatus.offline,
                    });

                    if (e.name === 'AbortError' || e.cancel) {
                        throw e;
                    }

                    if (e.name === 'AppVersionBadError') {
                        setApiStatus({ appVersionBad: true });
                        throw e;
                    }

                    if (e.name === 'InactiveSession') {
                        onLogout();
                        throw e;
                    }

                    handleErrorNotification();
                    throw e;
                });
        };
    }

    return (
        <ApiContext.Provider value={apiRef.current}>
            <ApiStatusContext.Provider value={apiStatus}>
                <ApiServerTimeContext.Provider value={apiServerTime}>{children}</ApiServerTimeContext.Provider>
            </ApiStatusContext.Provider>
        </ApiContext.Provider>
    );
};

ApiProvider.propTypes = {
    children: PropTypes.node.isRequired,
    config: PropTypes.object.isRequired,
    noErrorState: PropTypes.bool,
    UID: PropTypes.string,
    onLogout: PropTypes.func,
};

export default ApiProvider;
