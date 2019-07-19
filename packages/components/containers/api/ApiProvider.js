import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import xhr from 'proton-shared/lib/fetch/fetch';
import configureApi from 'proton-shared/lib/api';
import withAuthHandlers, { CancelUnlockError } from 'proton-shared/lib/api/helpers/withAuthHandlers';
import { getError } from 'proton-shared/lib/apiHandlers';

import ApiContext from './apiContext';
import useNotifications from '../notifications/useNotifications';
import useModals from '../modals/useModals';
import UnlockModal from '../login/UnlockModal';

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

            const { message } = getError(e);

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
