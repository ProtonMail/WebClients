import { useEffect, useState } from 'react';
import { useRouteMatch, useHistory } from 'react-router';
import Main from 'proton-account/src/app/public/Main';
import { c } from 'ttag';

import { Href, useApi, useNotifications } from '@proton/components';

import Header from 'proton-account/src/app/public/Header';
import Content from 'proton-account/src/app/public/Content';
import Footer from 'proton-account/src/app/public/Footer';

import { useDispatch } from 'react-redux';
import MessageDecryptForm from './MessageDecryptForm';
import { decrypt } from '../helpers/message';
import { loadEOMessage } from '../logic/eo/eoActions';
import { EOUrlParams } from '../helpers/eoUrl';
import { useOutsideMessage } from '../hooks/useOutsideMessage';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const Unlock = ({ setSessionStorage }: Props) => {
    const match = useRouteMatch<EOUrlParams>();
    // V_mApJs_SwdYVT62s8LeWMPW1pyPPZId_HHdNWOmAqenV5n0-P3cRKDfsY4OcqA0UqIcg49YQgDQb7VrHYmSz_N-bVZPgGNhCFln9n-sJbs=
    const { id } = match.params;
    const history = useHistory();
    const dispatch = useDispatch();
    const { encryptedToken } = useOutsideMessage({ id, setSessionStorage });
    const api = useApi();
    const { createNotification } = useNotifications();

    const [isError, setIsError] = useState(true);

    useEffect(() => {
        if (encryptedToken && encryptedToken !== '') {
            setIsError(false);
        }
    }, [encryptedToken]);

    const handleTryUnlock = async (password: string) => {
        if (password.length > 0 && id) {
            try {
                // Decrypt the message token
                const token = await decrypt(encryptedToken, password);

                await dispatch(loadEOMessage({ api, token, id, password, set: setSessionStorage }));

                history.push(`/message/${id}`);
            } catch (e) {
                console.error(e);
                createNotification({ text: c('Error').t`Wrong mailbox password`, type: 'error' });
            }
        } else {
            createNotification({ text: c('Error').t`Enter a password`, type: 'error' });
        }
    };

    if (isError) {
        return (
            <Main>
                <Header title={c('Title').t`Error`} />
                <Content>{c('Info').t`Sorry, this message does not exist or has already expired`}</Content>
            </Main>
        );
    }

    return (
        <Main>
            <Header title={c('Title').t`ProtonMail`} />
            <Content>
                <MessageDecryptForm onSubmit={handleTryUnlock} />
            </Content>
            <Footer className="mlauto">
                <Href className="mlauto mrauto" href="https://protonmail.com/support">{c('Action').t`Need help?`}</Href>
            </Footer>
        </Main>
    );
};

export default Unlock;
