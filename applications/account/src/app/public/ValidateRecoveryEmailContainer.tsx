import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { c } from 'ttag';
import { FullLoader, GenericError, useApi, useLoading } from '@proton/components';
import { postVerifyValidate } from '@proton/shared/lib/api/verify';

import PublicLayout from '../components/PublicLayout';

const ValidateRecoveryEmailContainer = () => {
    const api = useApi();
    const [error, setError] = useState<any>();
    const [loading, withLoading] = useLoading(true);
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        const jwt = location.hash.substring(1);

        history.replace(location.pathname);

        withLoading(api({ ...postVerifyValidate({ JWT: jwt }), silence: true }).catch(setError));
    }, []);

    const signIn = (
        <a key="1" href="/switch" target="_self">
            {c('Action').t`sign in`}
        </a>
    );

    if (error) {
        return (
            <GenericError>
                <span>{c('Recovery Email').t`There was a problem verifying your email address.`}</span>
                <span>{c('Recovery Email')
                    .jt`Please ${signIn} to resend a recovery email verification request.`}</span>
            </GenericError>
        );
    }

    return (
        <main className="main-area">
            {loading ? (
                <div className="absolute-center text-center">
                    <FullLoader size={200} />
                </div>
            ) : (
                <PublicLayout
                    main={c('Recovery Email').jt`Your recovery email has been successfully verified.`}
                    footer={c('Recovery Email').jt`You can safely close this tab.`}
                    below={c('Recovery Email').jt`Back to ${signIn}.`}
                />
            )}
        </main>
    );
};

export default ValidateRecoveryEmailContainer;
