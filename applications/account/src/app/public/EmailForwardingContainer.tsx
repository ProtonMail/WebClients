import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { GenericError, useApi, useErrorHandler } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { ExternalForwardingResult } from '@proton/shared/lib/api/forwardings';
import {
    acceptExternalForwarding,
    getExternalForwarding,
    rejectExternalForwarding,
} from '@proton/shared/lib/api/forwardings';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import ExpiredError from './ExpiredError';
import accountIllustration from './account-illustration.svg';

enum ErrorType {
    Expired,
    API,
}

export enum EmailForwardingRequest {
    Accept = 'accept',
    Decline = 'decline',
}

interface Props {
    request: EmailForwardingRequest;
}

const getHeader = (request: EmailForwardingRequest) => {
    if (request === 'accept') {
        return c('email_forwarding_2023: Title').t`Forwarding activated`;
    }

    if (request === 'decline') {
        return c('email_forwarding_2023: Title').t`Email forwarding deactivated`;
    }

    return '';
};

const getMain = (request: EmailForwardingRequest, forwarderEmail: string) => {
    if (request === 'accept') {
        return (
            <>
                <div className="text-center">{c('email_forwarding_2023: Info').t`You can safely close this tab.`}</div>
            </>
        );
    }

    if (request === 'decline') {
        const boldForwarderEmail = <strong key="forwarderEmail">{forwarderEmail}</strong>;
        return (
            <>
                <div className="text-center mb-3">{c('email_forwarding_2023: Info')
                    .jt`You won't receive emails forwarded automatically from ${boldForwarderEmail}.`}</div>
                <div className="text-center">{c('email_forwarding_2023: Info').t`You can safely close this tab.`}</div>
            </>
        );
    }

    return null;
};

const EmailForwardingContainer = ({ request }: Props) => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading(true);
    const silentApi = getSilentApi(api);
    const location = useLocation();
    const header = getHeader(request);
    const [forwarderEmail, setForwarderEmail] = useState<string>('');
    const main = getMain(request, forwarderEmail);

    useEffect(() => {
        const jwt = location.hash.replace('#', '');

        const promise = async () => {
            try {
                const { ForwarderEmail } = await silentApi<ExternalForwardingResult>(getExternalForwarding(jwt));
                setForwarderEmail(ForwarderEmail);
                if (request === EmailForwardingRequest.Accept) {
                    await api(acceptExternalForwarding(jwt));
                }
                if (request === EmailForwardingRequest.Decline) {
                    await api(rejectExternalForwarding(jwt));
                }
            } catch (error) {
                const { code } = getApiError(error);
                if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                    setError({ type: ErrorType.Expired });
                } else {
                    handleError(error);
                    setError({ type: ErrorType.API });
                }
            }
        };

        void withLoading(promise);
    }, []);

    return (
        <main className="main-area h-full">
            {(() => {
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute inset-center">
                                <ExpiredError type="forwarding" />
                            </div>
                        );
                    }
                    return (
                        <div className="absolute inset-center">
                            <GenericError className="text-center">
                                {c('email_forwarding_2023: Error message, recovery')
                                    .t`Please try opening the link again.`}
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
                        header={header}
                        main={main}
                        below={<PublicFooter />}
                    />
                );
            })()}
        </main>
    );
};

export default EmailForwardingContainer;
