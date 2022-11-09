import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { GenericError, useApi, useLoading } from '@proton/components';
import { postVerifyValidate } from '@proton/shared/lib/api/verify';

import PublicLayout from '../components/PublicLayout';

interface Props {
    onSubscribe: (jwt: string) => void;
}

const VerifyRecoveryEmailContainer = ({ onSubscribe }: Props) => {
    const api = useApi();
    const [error, setError] = useState<any>();
    const [loading, withLoading] = useLoading(true);
    const location = useLocation();
    const history = useHistory();
    const [jwt, setJwt] = useState('');
    const params = new URLSearchParams(location.search);
    const type = params.get('type');

    useEffect(() => {
        const jwt = location.hash.substring(1);

        history.replace({ search: location.search, hash: '' });

        withLoading(
            api({ ...postVerifyValidate({ JWT: jwt }), silence: true })
                .then(() => {
                    setJwt(jwt);
                })
                .catch(setError)
        );
    }, []);

    return (
        <main className="main-area">
            {(() => {
                if (error) {
                    const signIn = (
                        <a key="1" href="/switch" target="_self">
                            {c('Error message, recovery').t`sign in`}
                        </a>
                    );
                    return (
                        <div className="absolute-center text-center">
                            <GenericError>
                                <span>{c('Error message, recovery')
                                    .t`There was a problem verifying your email address.`}</span>
                                <span>{c('Error message, recovery')
                                    .jt`Please ${signIn} to resend a recovery email verification request.`}</span>
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
                const signIn = (
                    <a key="1" href="/switch" target="_self">
                        {c('Recovery Email').t`sign in`}
                    </a>
                );
                return (
                    <PublicLayout
                        main={c('Recovery Email').jt`Your recovery email has been successfully verified.`}
                        footer={
                            type === 'subscribe' && onSubscribe ? (
                                <Button color="norm" onClick={() => onSubscribe(jwt)}>{c('Action')
                                    .t`Manage communication preferences`}</Button>
                            ) : (
                                c('Recovery Email').jt`You can safely close this tab.`
                            )
                        }
                        below={c('Recovery Email').jt`Back to ${signIn}.`}
                    />
                );
            })()}
        </main>
    );
};

export default VerifyRecoveryEmailContainer;
