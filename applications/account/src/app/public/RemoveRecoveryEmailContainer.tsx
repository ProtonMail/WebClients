import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { GenericError, useApi, useLoading } from '@proton/components';
import { postVerifyUnvalidate } from '@proton/shared/lib/api/verify';

import PublicLayout from '../components/PublicLayout';

const RemoveRecoveryEmailContainer = () => {
    const api = useApi();
    const [error, setError] = useState<any>();
    const [loading, withLoading] = useLoading(true);
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        const jwt = location.hash.substring(1);
        history.replace(location.pathname);
        withLoading(api({ ...postVerifyUnvalidate({ JWT: jwt }), silence: true }).catch(setError));
    }, []);

    return (
        <main className="main-area">
            {(() => {
                const signIn = (
                    <a key="1" href="/switch" target="_self">
                        {c('Recovery Email').t`sign in`}
                    </a>
                );
                if (error) {
                    return (
                        <div className="absolute-center text-center">
                            <GenericError>
                                <span>{c('Error message, recovery')
                                    .t`There was a problem removing your email address.`}</span>
                                <span>{c('Recovery Email').jt`Back to ${signIn}.`}</span>
                            </GenericError>
                        </div>
                    );
                }
                if (loading) {
                    return (
                        <div className="absolute-center text-center">
                            <CircleLoader size="large" />
                        </div>
                    );
                }
                return (
                    <PublicLayout
                        main={c('Recovery Email').jt`Your recovery email has been successfully removed.`}
                        footer={c('Recovery Email').jt`You can safely close this tab.`}
                        below={c('Recovery Email').jt`Back to ${signIn}.`}
                    />
                );
            })()}
        </main>
    );
};

export default RemoveRecoveryEmailContainer;
