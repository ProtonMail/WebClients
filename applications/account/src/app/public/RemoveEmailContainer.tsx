import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { GenericError, useApi, useErrorHandler } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { postVerifyUnvalidate } from '@proton/shared/lib/api/verify';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import ExpiredError from './ExpiredError';
import accountIllustration from './account-illustration.svg';
import { stripQueryParams } from './jwt';

enum ErrorType {
    Expired,
    API,
}

const RemoveEmailContainer = () => {
    const api = useApi();
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading(true);
    const location = useLocation();
    const handleError = useErrorHandler();

    useEffect(() => {
        const jwt = stripQueryParams(location.hash.substring(1));
        const errorHandler = (error: any) => {
            const { code } = getApiError(error);
            if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                setError({ type: ErrorType.Expired });
            } else {
                handleError(error);
                setError({ type: ErrorType.API });
            }
        };

        void withLoading(api({ ...postVerifyUnvalidate({ JWT: jwt }), silence: true }).catch(errorHandler));
    }, []);

    return (
        <main className="main-area h-full">
            {(() => {
                const signIn = (
                    <a key="1" href={SSO_PATHS.SWITCH} target="_self">
                        {c('Recovery Email').t`sign in`}
                    </a>
                );
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute inset-center">
                                <ExpiredError type="email" />
                            </div>
                        );
                    }

                    return (
                        <div className="absolute inset-center text-center">
                            <GenericError>
                                <span>
                                    {c('Error message, recovery').t`There was a problem removing your email address.`}
                                </span>
                                <span>{c('Recovery Email').jt`Back to ${signIn}.`}</span>
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
                        header={c('Recovery Email').t`Email removed`}
                        main={
                            <div className="text-center">
                                <div className="mb-2">
                                    {c('Recovery Email').t`Your recovery email has been successfully removed.`}
                                </div>
                            </div>
                        }
                        footer={
                            <ButtonLike fullWidth as="a" href={SSO_PATHS.SWITCH} target="_self">
                                {c('Action').t`Sign in`}
                            </ButtonLike>
                        }
                        below={<PublicFooter />}
                    />
                );
            })()}
        </main>
    );
};

export default RemoveEmailContainer;
