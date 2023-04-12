import { useEffect } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '../../components';
import { useDocumentTitle } from '../../hooks';
import GenericError from '../error/GenericError';

interface Props {
    errorMessage?: string;
}

const StandardLoadErrorPage = ({ errorMessage }: Props) => {
    useDocumentTitle(c('Error message').t`Something went wrong`);

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

    // translator: The full sentence is "Please refresh the page or check your internet connection", "refresh the page" is a button
    const refresh = (
        <InlineLinkButton key="1" onClick={() => window.location.reload()}>{c('Action')
            .t`refresh the page`}</InlineLinkButton>
    );

    return (
        <div className="h100 flex flex-align-items-center pb4 scroll-if-needed">
            <GenericError>
                <span>{c('Error message').t`We couldn't load this page. `}</span>
                <span>
                    {
                        // translator: The full sentence is "Please refresh the page or check your internet connection", "refresh the page" is a button
                        c('Error message').jt`Please ${refresh} or check your internet connection.`
                    }
                </span>
                {errorMessage && (
                    <div className="mt1 p0-5 color-weak">{c('Error message').t`Error: ${errorMessage}`}</div>
                )}
            </GenericError>
        </div>
    );
};

export default StandardLoadErrorPage;
