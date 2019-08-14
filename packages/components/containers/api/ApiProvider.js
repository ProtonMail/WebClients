import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import xhr from 'proton-shared/lib/fetch/fetch';
import configureApi from 'proton-shared/lib/api';
import withApiHandlers, {
    CancelUnlockError,
    CancelVerificationError
} from 'proton-shared/lib/api/helpers/withApiHandlers';
import { getError } from 'proton-shared/lib/apiHandlers';
import { getDateHeader } from 'proton-shared/lib/fetch/helpers';
import { updateServerTime } from 'pmcrypto';
import { c } from 'ttag';

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

            if (e.name === 'OfflineError') {
                const text = navigator.onLine
                    ? c('Error').t`Could not connect to server.`
                    : c('Error').t`No internet connection found`;
                createNotification({ type: 'error', text });
                throw e;
            }

            if (e.name === 'TimeoutError') {
                createNotification({ type: 'error', text: c('Error').t`Request timed out.` });
                throw e;
            }

            const { message } = getError(e);

            if (message) {
                createNotification({ type: 'error', text: `${message}` });
            }

            throw e;
        };

        const handleUnlock = () => {
            return new Promise((resolve, reject) => {
                createModal(<UnlockModal onClose={() => reject(CancelUnlockError())} onSuccess={resolve} />);
            });
        };

        const handleVerification = ({ token, methods }) => {
            return new Promise((resolve, reject) => {
                createModal(
                    <HumanVerificationModal
                        token={token}
                        methods={methods}
                        onClose={() => reject(CancelVerificationError())}
                        onSuccess={resolve}
                    />
                );
            });
        };

        const call = configureApi({
            ...config,
            xhr,
            UID
        });

        const callWithApiHandlers = withApiHandlers({
            call,
            onError: handleError,
            onUnlock: handleUnlock,
            onVerification: handleVerification
        });

        apiRef.current = ({ output = 'json', ...rest }) => {
            return callWithApiHandlers(rest).then((response) => {
                const serverTime = getDateHeader(response.headers);
                if (serverTime) {
                    updateServerTime(serverTime);
                }
                return response[output]();
            });
        };
    }

    return <ApiContext.Provider value={apiRef.current}>{children}</ApiContext.Provider>;
};

ApiProvider.propTypes = {
    children: PropTypes.node.isRequired,
    config: PropTypes.object.isRequired,
    UID: PropTypes.string,
    onLogout: PropTypes.func
};

export default ApiProvider;
