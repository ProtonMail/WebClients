import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike, CircleLoader, Href } from '@proton/atoms';
import { GenericError, useApi, useErrorHandler } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { disableUser } from '@proton/shared/lib/api/user';
import { postVerifyUnvalidate } from '@proton/shared/lib/api/verify';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import ExpiredError from './ExpiredError';
import accountIllustration from './account-illustration.svg';

enum ErrorType {
    Expired,
    API,
}

const RemoveEmailContainer = ({ type = 'recovery-email' }: { type?: 'recovery-email' | 'account-email' }) => {
    const api = useApi();
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading(true);
    const location = useLocation();
    const handleError = useErrorHandler();

    useEffect(() => {
        const jwt = location.hash.substring(1);
        const errorHandler = (error: any) => {
            const { code } = getApiError(error);
            if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                setError({ type: ErrorType.Expired });
            } else {
                handleError(error);
                setError({ type: ErrorType.API });
            }
        };
        if (type === 'recovery-email') {
            withLoading(api({ ...postVerifyUnvalidate({ JWT: jwt }), silence: true }).catch(errorHandler));
        } else {
            withLoading(api({ ...disableUser({ JWT: jwt }), silence: true }).catch(errorHandler));
        }
    }, []);

    return (
        <main className="main-area h100">
            {(() => {
                const signIn = (
                    <a key="1" href={SSO_PATHS.SWITCH} target="_self">
                        {c('Recovery Email').t`sign in`}
                    </a>
                );
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute-center">
                                <ExpiredError type={type === 'recovery-email' ? 'email' : 'report'} />
                            </div>
                        );
                    }

                    return (
                        <div className="absolute-center text-center">
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
                        <div className="absolute-center text-center">
                            <CircleLoader size="large" />
                        </div>
                    );
                }
                return (
                    <PublicLayout
                        className="h100"
                        img={<img src={accountIllustration} alt="" />}
                        header={
                            type === 'recovery-email'
                                ? c('Recovery Email').t`Email removed`
                                : c('Email').t`Thanks for letting us know`
                        }
                        main={
                            <div className="text-center">
                                <div className="mb-2">
                                    {type === 'recovery-email'
                                        ? c('Recovery Email').t`Your recovery email has been successfully removed.`
                                        : c('Email')
                                              .t`We've noted that this account doesn't belong to you. We'll investigate and act accordingly.`}
                                </div>
                            </div>
                        }
                        footer={
                            type === 'recovery-email' ? (
                                <ButtonLike fullWidth as="a" href={SSO_PATHS.SWITCH} target="_self">
                                    {c('Action').t`Sign in`}
                                </ButtonLike>
                            ) : null
                        }
                        below={
                            type === 'recovery-email' ? (
                                <PublicFooter />
                            ) : (
                                <PublicFooter center={false}>
                                    <div className="color-weak">
                                        {c('Info')
                                            .t`${BRAND_NAME} is privacy you can trust, ensured by strong encryption, open-source code, and Swiss privacy laws. We believe nobody should be able to exploit your data, period. Our technology and business are based upon this fundamentally stronger definition of privacy.`}
                                    </div>
                                    <br />
                                    <div className="mb-6 color-weak">
                                        {c('Info')
                                            .t`Over 100 million people and businesses have signed up for ${BRAND_NAME}.`}{' '}
                                        <Href className="color-weak" href={getStaticURL('')}>
                                            {c('Link').t`Learn more`}
                                        </Href>
                                    </div>
                                </PublicFooter>
                            )
                        }
                    />
                );
            })()}
        </main>
    );
};

export default RemoveEmailContainer;
