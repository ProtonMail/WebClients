import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import xhr from 'proton-shared/lib/fetch/fetch';
import configureApi from 'proton-shared/lib/api';
import withAuthHandlers, { CancelUnlockError } from 'proton-shared/lib/api/helpers/withAuthHandlers';
import { getError } from 'proton-shared/lib/apiHandlers';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';

const { HUMAN_VERIFICATION_REQUIRED } = API_CUSTOM_ERROR_CODES;

import ApiContext from './apiContext';
import useNotifications from '../notifications/useNotifications';
import useModals from '../modals/useModals';
import UnlockModal from '../login/UnlockModal';
import HumanVerificationModal from './HumanVerificationModal';

const ApiProvider = ({ config, onLogout, children, UID }) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const apiRef = useRef();

    if (!apiRef.current) {
        const handleError = (e) => {
            if (e.name === 'InactiveSession') {
                onLogout();
                throw e;
            }

            if (e.name === 'CancelUnlock') {
                throw e;
            }

            const { message, code } = getError(e);

            if (code === HUMAN_VERIFICATION_REQUIRED) {
                const { Details = {} } = e.data;
                const { Token, VerifyMethods = [] } = Details;
                return new Promise((resolve, reject) => {
                    createModal(
                        <HumanVerificationModal
                            token={Token}
                            methods={VerifyMethods}
                            onClose={reject}
                            onSuccess={resolve}
                        />
                    );
                }).then(({ token: Token, method: TokenType }) => {
                    const hasParams = ['get', 'delete'].includes(e.config.method.toLowerCase());
                    const key = hasParams ? 'params' : 'data';
                    return apiRef.current({
                        ...e.config,
                        [key]: {
                            ...e.config[key],
                            Token,
                            TokenType
                        }
                    });
                });
            }

            if (message) {
                createNotification({
                    type: 'error',
                    text: `${message}`
                });
            }

            throw e;
        };

        const handleUnlock = () => {
            return new Promise((resolve, reject) => {
                createModal(<UnlockModal onClose={() => reject(CancelUnlockError())} onSuccess={resolve} />);
            });
        };

        const call = configureApi({
            ...config,
            xhr,
            UID
        });

        apiRef.current = withAuthHandlers({
            call,
            onError: handleError,
            onUnlock: handleUnlock
        });
    }

    return <ApiContext.Provider value={apiRef.current}>{children}</ApiContext.Provider>;
};

ApiProvider.propTypes = {
    children: PropTypes.node.isRequired,
    UID: PropTypes.string.isRequired,
    config: PropTypes.object.isRequired,
    onLogout: PropTypes.func.isRequired
};

export default ApiProvider;
