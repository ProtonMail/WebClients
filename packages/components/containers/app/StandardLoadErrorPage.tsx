import React, { useEffect } from 'react';
import { c } from 'ttag';
import GenericError from '../error/GenericError';
import { InlineLinkButton, ProminentContainer } from '../../components';
import { useDocumentTitle } from '../../hooks';

const StandardLoadErrorPage = () => {
    useDocumentTitle(c('Error message').t`Oops, something went wrong`);

    useEffect(() => {
        const wasOffline = !navigator.onLine;

        const handleOnline = () => {
            // If the user was offline and comes back online, automatically refresh the page to retry the operation.
            // This is intended to handle the case where one of the dependencies fails to load due to a connection issue.
            if (wasOffline && navigator.onLine) {
                return window.location.reload();
            }
        };

        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const refresh = (
        <InlineLinkButton key="1" onClick={() => window.location.reload()}>{c('Action')
            .t`refresh the page`}</InlineLinkButton>
    );

    return (
        <ProminentContainer>
            <GenericError>
                <span>{c('Error message').t`There was a problem connecting to Proton.`}</span>
                <span>{c('Error message').jt`Please ${refresh} or check your connection.`}</span>
            </GenericError>
        </ProminentContainer>
    );
};

export default StandardLoadErrorPage;
