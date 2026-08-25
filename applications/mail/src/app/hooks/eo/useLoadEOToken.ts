import { useHistory } from 'react-router';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';

import { EO_MESSAGE_REDIRECT_PATH } from '../../constants';
import { eoDecrypt } from '../../helpers/eo/message';
import { loadEOMessage } from '../../store/eo/eoActions';
import { useMailDispatch } from '../../store/hooks';

interface Props {
    id?: string;
    encryptedToken: string;
    setSessionStorage: (key: string, data: any) => void;
}

export const useLoadEOToken = ({ id, encryptedToken, setSessionStorage }: Props) => {
    const api = useApi();
    const dispatch = useMailDispatch();
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
                createNotification({ text: c('Error').t`Wrong password`, type: 'error' });
            }
        } else {
            createNotification({ text: c('Error').t`Enter a password`, type: 'error' });
        }
    };

    return { handleTryUnlock };
};
