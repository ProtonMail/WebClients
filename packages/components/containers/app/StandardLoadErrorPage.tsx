import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

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

    return (
        <div className={clsx('h-full flex items-center pb-4 overflow-auto', isElectronMail && 'bg-norm')}>
            <GenericError isNetworkError>
                <div
                    className="text-weak text-sm text-center max-w-custom"
                    style={{ '--max-w-custom': '16.875rem' }}
                >{c('Error message')
                    .t`We couldn't load this page. Please refresh the page or check your internet connection.`}</div>
                {errorMessage && (
                    <div className="text-weak text-sm mt-4">{c('Error message').t`Error: ${errorMessage}`}</div>
                )}
                <div className="mt-8">
                    <Button onClick={() => window.location.reload()}>
                        <Icon name="arrow-rotate-right" />
                        <span className="ml-4">{c('Action').t`Refresh the page`}</span>
                    </Button>
                </div>
            </GenericError>
        </div>
    );
};

export default StandardLoadErrorPage;
