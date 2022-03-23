import { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router';
import { c } from 'ttag';

import { Href, Loader } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import MessageDecryptForm from './MessageDecryptForm';
import { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useLoadEOMessage } from '../../../hooks/eo/useLoadEOMessage';
import { useLoadEOToken } from '../../../hooks/eo/useLoadEOToken';

interface Props {
    setSessionStorage: (key: string, data: any) => void;
}

const EOUnlock = ({ setSessionStorage }: Props) => {
    const match = useRouteMatch<EOUrlParams>();
    const { id } = match.params;
    const { encryptedToken, isStoreInitialized } = useLoadEOMessage({ id, setSessionStorage });
    const { handleTryUnlock } = useLoadEOToken({ id, encryptedToken, setSessionStorage });

    const [isError, setIsError] = useState(true);

    useEffect(() => {
        if (encryptedToken && encryptedToken !== '') {
            setIsError(false);
        }
    }, [encryptedToken]);

    if (!isStoreInitialized) {
        return <Loader />;
    }

    return (
        <main className="ui-standard color-norm bg-norm relative no-scroll w100 max-w100 center eo-layout mw30r">
            <div className="eo-layout-header">
                <h1 className="eo-layout-title text-center mt1 mb0-5">
                    <strong>{isError ? c('Title').t`Error` : MAIL_APP_NAME}</strong>
                </h1>
            </div>
            <div className="eo-layout-main-content">
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
