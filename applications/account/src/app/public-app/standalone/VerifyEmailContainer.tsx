import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import GenericError from '@proton/components/containers/error/GenericError';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import useLoading from '@proton/hooks/useLoading';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { postVerifyValidate } from '@proton/shared/lib/api/verify';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import accountIllustration from '../assets/account-illustration.svg';
import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import { UNAUTHENTICATED_ROUTES } from '../helper';
import ExpiredError from './ExpiredError';
import { stripQueryParams } from './jwt';

enum ErrorType {
    Expired = 0,
    API = 1,
}

const VerifyEmailContainer = () => {
    const history = useHistory();
    const silentApi = useSilentApi();
    const handleError = useErrorHandler();
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading(true);
    const location = useLocation();
    const [jwt, setJwt] = useState('');
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const email = params.get('email');

    useEffect(() => {
        const jwt = stripQueryParams(location.hash.substring(1));

        const promise = silentApi(postVerifyValidate({ JWT: jwt }))
            .then(() => {
                setJwt(jwt);
            })
            .catch((error) => {
                const { code } = getApiError(error);
                if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                    setError({ type: ErrorType.Expired });
                } else {
                    handleError(error);
                    setError({ type: ErrorType.API });
                }
            });

        void withLoading(promise);
    }, []);

    const searchParams = new URLSearchParams({
        email: email || '',
    });

    return (
        <main className="main-area h-full">
            {(() => {
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute inset-center">
                                <ExpiredError type="email" />
                            </div>
                        );
                    }
                    const signIn = (
                        <a key="1" href={SSO_PATHS.SWITCH} target="_self">
                            {c('Error message, recovery').t`sign in`}
                        </a>
                    );
                    return (
                        <div className="absolute inset-center">
                            <GenericError className="text-center">
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
                        <div className="absolute inset-center text-center">
                            <CircleLoader size="large" />
                        </div>
                    );
                }
                return (
                    <PublicLayout
                        className="h-full"
                        img={<img src={accountIllustration} alt="" />}
                        header={c('Email').t`Email verified`}
                        main={
                            <div className="text-center">
                                <div className="mb-2">{c('Email').t`Thank you for verifying your email address.`}</div>
                                {c('Email').t`You can safely close this tab.`}
                            </div>
                        }
                        footer={
                            type === 'subscribe' ? (
                                <Button
                                    color="norm"
                                    fullWidth
                                    onClick={() =>
                                        history.replace({ pathname: UNAUTHENTICATED_ROUTES.UNSUBSCRIBE, hash: jwt })
                                    }
                                >
                                    {c('Action').t`Manage communication preferences`}
                                </Button>
                            ) : (
                                <ButtonLike
                                    fullWidth
                                    as="a"
                                    href={`${SSO_PATHS.SWITCH}?${searchParams.toString()}`}
                                    target="_self"
                                    color="norm"
                                >
                                    {c('Action').t`Sign in`}
                                </ButtonLike>
                            )
                        }
                        below={<PublicFooter />}
                    />
                );
            })()}
        </main>
    );
};
export default VerifyEmailContainer;
