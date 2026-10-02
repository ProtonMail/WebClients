import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { ForgotPasswordContext } from '../wizard/ForgotPasswordContext';

const decodeAutomaticResetParams = (base64String: string) => {
    const decodedString = uint8ArrayToBinaryString(Uint8Array.fromBase64(base64String, { alphabet: 'base64url' }));
    return JSON.parse(decodedString);
};

/**
 * A recovery link (username and recovery phrase in the URL hash) has the machine check the phrase right away. The
 * hash is removed from the URL once read.
 */
export const useAutomaticMnemonicVerification = () => {
    const { send } = ForgotPasswordContext.useActorRef();
    const history = useHistory();
    const location = useLocation();
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const hash = location.hash.slice(1);
        if (!hash) {
            return;
        }
        history.replace({ ...location, hash: '' });

        let params;
        try {
            params = decodeAutomaticResetParams(hash);
        } catch (error) {
            errorHandler(error);
        }

        if (!params) {
            return;
        }

        const { username, value } = params;
        if (!username || !value) {
            return;
        }

        send({ type: 'recoveryLink.opened', payload: { username, mnemonic: value } });
    }, []);
};
