import { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Loader } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { EOUrlParams } from '../../../helpers/eo/eoUrl';
import { useLoadEOMessage } from '../../../hooks/eo/useLoadEOMessage';
import { useLoadEOToken } from '../../../hooks/eo/useLoadEOToken';
import MessageDecryptForm from './MessageDecryptForm';

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
        <main className="ui-standard sm:shadow-lifted shadow-color-primary relative no-scroll w-full max-w-custom mx-auto eo-layout" style={{ '--max-w-custom': '30rem' }}>
            <div className="eo-layout-header">
                {isError && <h1 className="eo-layout-title mt-4" data-testid="eo:error">{c('Title').t`Error`}</h1>}
            </div>
            <div className="eo-layout-main-content">
                {isError ? (
                    c('Info').t`Sorry, this message does not exist or has already expired.`
                ) : (
                    <MessageDecryptForm onSubmit={handleTryUnlock} />
                )}
            </div>
            <div className="flex p-4 ml-auto mb-8">
                <Href className="mx-auto" href={getKnowledgeBaseUrl('/open-password-protected-emails')}>{c('Action')
                    .t`Need help?`}</Href>
            </div>
        </main>
    );
};

export default EOUnlock;
