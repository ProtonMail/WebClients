import React, { useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import xhr from 'proton-shared/lib/fetch/fetch';
import configureApi from 'proton-shared/lib/api';
import withApiHandlers, {
    CancelUnlockError,
    CancelVerificationError,
} from 'proton-shared/lib/api/helpers/withApiHandlers';
import { getDateHeader } from 'proton-shared/lib/fetch/helpers';
import { updateServerTime } from 'pmcrypto';
import {
    getApiError,
    getApiErrorMessage,
    getIsTimeoutError,
    getIsUnreachableError,
} from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { getClientID } from 'proton-shared/lib/apps/helper';
import { localeCode } from 'proton-shared/lib/i18n';
import { withLocaleHeaders } from 'proton-shared/lib/fetch/headers';

import ApiContext from './apiContext';
import ApiStatusContext, { defaultApiStatus } from './apiStatusContext';
import { useModals, useNotifications } from '../../hooks';
import UnlockModal from '../login/UnlockModal';
import DelinquentModal from './DelinquentModal';
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
const ApiProvider = ({ config, onLogout, children, UID }) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [apiStatus, setApiStatus] = useReducer(reducer, defaultApiStatus);
    const apiRef = useRef();

    if (!apiRef.current) {
        const handleError = (e) => {
            const { code } = getApiError(e);
            const errorMessage = getApiErrorMessage(e);

            if (e.name === 'CancelUnlock' || e.name === 'AbortError') {
                throw e;
            }

            if (getIsUnreachableError(e)) {
                setApiStatus({ apiUnreachable: true });
                throw e;
            }

            setApiStatus({ apiUnreachable: false });

            if (e.name === 'AppVersionBadError') {
                setApiStatus({ appVersionBad: true });
                throw e;
            }

            if (e.name === 'InactiveSession') {
                // Logout if the provider was created with a UID
                if (UID) {
                    onLogout();
                }
                throw e;
            }

            if (getIsTimeoutError(e)) {
                const isSilenced = getSilenced(e.config, code);
                if (!isSilenced) {
                    createNotification({ type: 'error', text: errorMessage });
                }
                throw e;
            }

            if (errorMessage) {
                const isSilenced = getSilenced(e.config, code);
                if (!isSilenced) {
                    createNotification({ type: 'error', text: errorMessage });
                }
            }

            throw e;
        };

        const handleUnlock = (missingScopes = [], e) => {
            if (missingScopes.includes('nondelinquent')) {
                return new Promise((resolve, reject) => {
                    createModal(<DelinquentModal onClose={() => reject(CancelUnlockError())} />);
                });
            }
            if (missingScopes.includes('locked')) {
                return new Promise((resolve, reject) => {
                    createModal(<UnlockModal onClose={() => reject(CancelUnlockError())} onSuccess={resolve} />);
                });
            }
            return Promise.reject(e);
        };

        const handleVerification = ({ token, methods, onVerify }) => {
            return new Promise((resolve, reject) => {
                createModal(
                    <HumanVerificationModal
                        token={token}
                        methods={methods}
                        onVerify={onVerify}
                        onSuccess={resolve}
                        onError={reject}
                        onClose={() => reject(CancelVerificationError())}
                    />
                );
            });
        };

        const call = configureApi({
            ...config,
            CLIENT_ID: getClientID(config.APP_NAME),
            xhr,
            UID,
        });

        const callWithApiHandlers = withApiHandlers({
            call,
            UID,
            onError: handleError,
            onUnlock: handleUnlock,
            onVerification: handleVerification,
        });

        apiRef.current = ({ output = 'json', ...rest }) => {
            // Only need to send locale headers in public app
            const config = UID ? rest : withLocaleHeaders(localeCode, rest);
            return callWithApiHandlers(config)
                .then((response) => {
                    const serverTime = getDateHeader(response.headers);
                    if (serverTime) {
                        updateServerTime(serverTime);
                    }
                    setApiStatus({ apiUnreachable: false });
                    return output === 'stream' ? response.body : response[output]();
                })
                .catch((e) => {
                    const serverTime = e.response?.headers ? getDateHeader(e.response.headers) : undefined;
                    if (serverTime) {
                        updateServerTime(serverTime);
                    }
                    throw e;
                });
        };
    }

    return (
        <ApiContext.Provider value={apiRef.current}>
            <ApiStatusContext.Provider value={apiStatus}>{children}</ApiStatusContext.Provider>
        </ApiContext.Provider>
    );
};

ApiProvider.propTypes = {
    children: PropTypes.node.isRequired,
    config: PropTypes.object.isRequired,
    UID: PropTypes.string,
    onLogout: PropTypes.func,
};

export default ApiProvider;
