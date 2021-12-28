import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouteMatch, useHistory } from 'react-router';
import { c } from 'ttag';

import { Href, Loader, useApi, useNotifications } from '@proton/components';

import MessageDecryptForm from './MessageDecryptForm';
import { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useLoadEOMessage } from '../../../hooks/eo/useLoadEOMessage';
import { eoDecrypt } from '../../../helpers/eo/message';
import { loadEOMessage } from '../../../logic/eo/eoActions';
import { EO_MESSAGE_REDIRECT_PATH } from '../../../constants';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const EOUnlock = ({ setSessionStorage }: Props) => {
    const api = useApi();
    const history = useHistory();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;
    const { encryptedToken, isStoreInitialized } = useLoadEOMessage({ id, setSessionStorage });

    const [isError, setIsError] = useState(true);

    useEffect(() => {
        if (encryptedToken && encryptedToken !== '') {
            setIsError(false);
        }
    }, [encryptedToken]);

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

    if (!isStoreInitialized) {
        return <Loader />;
    }

    return (
        <main className="ui-standard color-norm bg-norm relative no-scroll w100 max-w100 center sign-layout mw30r">
            <div className="sign-layout-header">
                <h1 className="sign-layout-title text-center mt1 mb0-5">
                    <strong>{isError ? c('Title').t`Error` : c('Title').t`ProtonMail`}</strong>
                </h1>
            </div>
            <div className="sign-layout-main-content">
                {isError ? (
                    c('Info').t`Sorry, this message does not exist or has already expired`
                ) : (
                    <MessageDecryptForm onSubmit={handleTryUnlock} />
                )}
            </div>
            <div className="border-top flex p1 mlauto">
                <Href className="mlauto mrauto" href="https://protonmail.com/support">{c('Action').t`Need help?`}</Href>
            </div>
        </main>
    );
};

export default EOUnlock;
