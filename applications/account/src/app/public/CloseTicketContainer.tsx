import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { GenericError, useApi, useErrorHandler } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { closeTicket } from '@proton/shared/lib/api/reports';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import accountIllustration from './account-illustration.svg';

enum ErrorType {
    Expired,
    API,
    MissingParameters,
}

const CloseTicketContainer = () => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const silentApi = getSilentApi(api);
    const location = useLocation();
    const [loading, withLoading] = useLoading(true);
    const closeTab = () => {
        window.close();
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ticketID = params.get('ticket_id');
        const requesterID = params.get('requester_id');
        const createdAt = params.get('created_at');
        const brandID = params.get('brand_id'); // BrandID is currently not available in the link generation part in Zendesk

        const run = async (ticketID: string, requesterID: string, createdAt: string, brandID: string | null) => {
            try {
                // They are all strings but the API expects numbers for ticketID, requesterID, and brandID
                await silentApi(closeTicket(+ticketID, +requesterID, createdAt, brandID ? +brandID : undefined));
            } catch (error) {
                handleError(error);
                setError({ type: ErrorType.API });
            }
        };

        if (ticketID && requesterID && createdAt) {
            void withLoading(run(ticketID, requesterID, createdAt, brandID));
        } else {
            setError({ type: ErrorType.MissingParameters });
        }
    }, []);

    return (
        <main className="main-area h-full">
            {(() => {
                if (error) {
                    if (error.type === ErrorType.MissingParameters) {
                        return (
                            <div className="absolute inset-center">
                                <GenericError className="text-center">
                                    {c('Error message').t`Missing parameters in the URL.`}
                                </GenericError>
                            </div>
                        );
                    }
                    return (
                        <div className="absolute inset-center">
                            <GenericError className="text-center">
                                {c('Error message').t`Support ticket does not exist.`}
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
                        header={c('Title').t`Support ticket closed`}
                        main={
                            <>
                                <p className="text-center">{c('Info')
                                    .t`Your support ticket has been closed. Thank you for contacting ${BRAND_NAME} support.`}</p>
                                <p className="text-center">{c('Info').t`You can now close this tab.`}</p>
                                <div className="text-center">
                                    <Button onClick={closeTab}>{c('Action').t`Close tab`}</Button>
                                </div>
                            </>
                        }
                        below={<PublicFooter />}
                    />
                );
            })()}
        </main>
    );
};

export default CloseTicketContainer;
