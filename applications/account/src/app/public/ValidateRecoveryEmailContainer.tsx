import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { c } from 'ttag';
import { CircleLoader, GenericError, useApi, useLoading } from '@proton/components';
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

    if (error) {
        // This sign in variable is not shared with the sign in variable below to allow for different translations.
        const signIn = (
            <a key="1" href="/switch" target="_self">
                {c('Error message, recovery').t`sign in`}
            </a>
        );
        return (
            <GenericError>
                <span>{c('Error message, recovery').t`There was a problem verifying your email address.`}</span>
                <span>{c('Error message, recovery')
                    .jt`Please ${signIn} to resend a recovery email verification request.`}</span>
            </GenericError>
        );
    }

    const signIn = (
        <a key="1" href="/switch" target="_self">
            {c('Recovery Email').t`sign in`}
        </a>
    );

    return (
        <main className="main-area">
            {loading ? (
                <div className="absolute-center text-center">
                    <CircleLoader size="large" />
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
