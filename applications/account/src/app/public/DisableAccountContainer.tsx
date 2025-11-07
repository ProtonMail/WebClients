import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { GenericError, useApi, useErrorHandler } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { disableUser } from '@proton/shared/lib/api/user';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import ExpiredError from './ExpiredError';
import accountIllustration from './account-illustration.svg';
import { stripQueryParams } from './jwt';

const Footer = () => {
    return <PublicFooter center={false} includeDescription />;
};

enum ErrorType {
    Expired,
    API,
}

const DisableAccount = () => {
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

        void withLoading(api({ ...disableUser({ JWT: jwt }), silence: true }).catch(errorHandler));
    }, []);

    return (
        <main className="main-area h-full">
            {(() => {
                const signIn = (
                    <a key="1" href={SSO_PATHS.SWITCH} target="_self">
                        {c('Disable account').t`sign in`}
                    </a>
                );
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute inset-center">
                                <ExpiredError type="report" />
                            </div>
                        );
                    }

                    return (
                        <div className="absolute inset-center text-center">
                            <GenericError>
                                <span>
                                    {c('Error message, Disable account').t`There was a problem disabling your account.`}
                                </span>
                                <span>{c('Disable account').jt`Back to ${signIn}.`}</span>
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
                        header={c('Disable account').t`Thanks for letting us know`}
                        main={
                            <div className="text-center">
                                <div className="mb-2">
                                    {c('Disable account')
                                        .t`We've noted that this account doesn't belong to you. We'll investigate and act accordingly.`}
                                </div>
                            </div>
                        }
                        below={<Footer />}
                    />
                );
            })()}
        </main>
    );
};

enum Step {
    CONFIRM,
    DISABLE_ACCOUNT,
}

const DisableAccountContainer = () => {
    const [step, setStep] = useState(Step.CONFIRM);

    if (step === Step.CONFIRM) {
        return (
            <main className="main-area h-full">
                <PublicLayout
                    className="h-full"
                    img={<img src={accountIllustration} alt="" />}
                    header={c('Disable account').t`Didn't create an account?`}
                    main={
                        <div className="text-center">
                            <div className="mb-2">
                                {c('Disable account')
                                    .t`This is usually nothing to worry about. Just click below to confirm that this ${BRAND_NAME} Account isn't yours, and we'll disable it.`}
                            </div>
                            <div className="mb-12">{c('Disable account').t`You can safely close this tab.`}</div>
                            <Button
                                fullWidth
                                color="danger"
                                shape="outline"
                                onClick={() => setStep(Step.DISABLE_ACCOUNT)}
                            >
                                {c('Disable account').t`I didn't create this account`}
                            </Button>
                        </div>
                    }
                    below={<Footer />}
                />
            </main>
        );
    }

    return <DisableAccount />;
};

export default DisableAccountContainer;
