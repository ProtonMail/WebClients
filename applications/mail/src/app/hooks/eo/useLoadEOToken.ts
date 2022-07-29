import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';

import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components';

import { EO_MESSAGE_REDIRECT_PATH } from '../../constants';
import { eoDecrypt } from '../../helpers/eo/message';
import { loadEOMessage } from '../../logic/eo/eoActions';

interface Props {
    id?: string;
    encryptedToken: string;
    setSessionStorage: (key: string, data: any) => void;
}

export const useLoadEOToken = ({ id, encryptedToken, setSessionStorage }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const history = useHistory();

    const handleTryUnlock = async (password: string) => {
        if (password.length > 0 && id) {
            try {
                const token = await eoDecrypt(encryptedToken, password);

                await dispatch(loadEOMessage({ api, token, id, password, set: setSessionStorage }));

                history.push(`${EO_MESSAGE_REDIRECT_PATH}/${id}`);
            } catch (e: any) {
                console.error(e);
                createNotification({ text: c('Error').t`Wrong mailbox password`, type: 'error' });
            }
        } else {
            createNotification({ text: c('Error').t`Enter a password`, type: 'error' });
        }
    };

    return { handleTryUnlock };
};
